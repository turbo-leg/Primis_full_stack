"""Tests for NotificationService filtering and timestamp behavior."""

from collections.abc import Generator
from datetime import datetime, timedelta
from typing import Any, cast

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import Base
from app.models.notification_models import (
    Notification,
    NotificationLog,
    NotificationPreference,
    NotificationPriority,
    NotificationType,
)
from app.services.notification_service import NotificationService


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    """Provide a transactional scope around a series of operations."""
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(
        bind=engine,
        tables=[
            Notification.__table__,
            NotificationPreference.__table__,
            NotificationLog.__table__,
        ],
    )
    TestingSessionLocal = sessionmaker(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


def test_create_notification_uses_utc_for_expiration(db_session: Session) -> None:
    service = NotificationService(db_session)
    before = datetime.utcnow()
    notification = service.create_notification(
        user_id=1,
        user_type="student",
        notification_type=NotificationType.PAYMENT_DUE,
        title="Payment Due Soon",
        message="Please submit payment.",
        priority=NotificationPriority.HIGH,
        expires_in_days=1,
    )

    expires_at = cast(datetime, getattr(notification, "expires_at"))
    delta = expires_at - before
    assert timedelta(hours=23, minutes=50) < delta <= timedelta(days=1, minutes=5)


def test_get_user_notifications_supports_filters(db_session: Session) -> None:
    service = NotificationService(db_session)

    service.create_notification(
        user_id=1,
        user_type="student",
        notification_type=NotificationType.PAYMENT_DUE,
        title="Payment Due",
        message="Payment is due.",
        priority=NotificationPriority.HIGH,
    )

    service.create_notification(
        user_id=1,
        user_type="student",
        notification_type=NotificationType.ASSIGNMENT_CREATED,
        title="Assignment Posted",
        message="New assignment available.",
        priority=NotificationPriority.MEDIUM,
    )

    filtered = service.get_user_notifications(
        user_id=1,
        user_type="student",
        notification_type=NotificationType.PAYMENT_DUE,
    )

    assert len(filtered) == 1
    assert getattr(filtered[0], "notification_type") == NotificationType.PAYMENT_DUE

    high_priority = service.get_user_notifications(
        user_id=1,
        user_type="student",
        priority=NotificationPriority.HIGH,
    )

    assert len(high_priority) == 1
    assert getattr(high_priority[0], "priority") == NotificationPriority.HIGH


def test_mark_all_as_read_sets_timestamp(db_session: Session) -> None:
    service = NotificationService(db_session)

    for _ in range(2):
        service.create_notification(
            user_id=2,
            user_type="student",
            notification_type=NotificationType.ANNOUNCEMENT,
            title="Announcement",
            message="General info.",
        )

    updated = service.mark_all_as_read(user_id=2, user_type="student")
    assert updated == 2

    notifications = db_session.query(Notification).filter(Notification.user_id == 2).all()
    assert all(getattr(n, "is_read") for n in notifications)
    assert all(getattr(n, "read_at") is not None for n in notifications)
