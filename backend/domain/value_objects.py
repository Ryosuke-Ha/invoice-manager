from dataclasses import dataclass
from datetime import date, timedelta, datetime, timezone

from domain.exceptions import InvalidAmountError, InvalidIssueDateError


JST = timezone(timedelta(hours=9))


@dataclass(frozen=True)
class WeekPeriod:
    """
    週を表す値オブジェクト。
    必ず日曜日始まりであることを保証する。
    """
    start: date  # 必ず日曜日

    def __post_init__(self):
        # weekday(): 月=0, 火=1, ..., 土=5, 日=6
        if self.start.weekday() != 6:
            raise ValueError(
                f"WeekPeriod must start on Sunday, got {self.start} "
                f"({self.start.strftime('%A')})"
            )

    @property
    def end(self) -> date:
        return self.start + timedelta(days=6)

    @classmethod
    def current(cls) -> "WeekPeriod":
        """今週のWeekPeriodを返す（JST基準）"""
        today = datetime.now(JST).date()
        return cls.from_date(today)

    @classmethod
    def from_date(cls, d: date) -> "WeekPeriod":
        """任意の日付が属する週のWeekPeriodを返す"""
        days_since_sunday = (d.weekday() + 1) % 7
        sunday = d - timedelta(days=days_since_sunday)
        return cls(sunday)

    @classmethod
    def previous(cls) -> "WeekPeriod":
        """先週のWeekPeriodを返す"""
        current = cls.current()
        return cls(current.start - timedelta(days=7))

    def contains(self, d: date) -> bool:
        """指定した日付がこの週に含まれるか"""
        return self.start <= d <= self.end

    def __str__(self) -> str:
        return f"{self.start} 〜 {self.end}"


@dataclass(frozen=True)
class YearMonth:
    """
    年月を表す値オブジェクト。
    YYYY-MM形式の文字列を安全に扱う。
    """
    year: int
    month: int

    def __post_init__(self):
        if not (1 <= self.month <= 12):
            raise ValueError(f"Invalid month: {self.month}")
        if self.year < 2000:
            raise ValueError(f"Invalid year: {self.year}")

    @classmethod
    def from_string(cls, s: str) -> "YearMonth":
        """'YYYY-MM'形式の文字列からYearMonthを生成"""
        try:
            year, month = s.split("-")
            return cls(int(year), int(month))
        except (ValueError, AttributeError):
            raise ValueError(f"Invalid year-month format: {s}")

    @classmethod
    def current(cls) -> "YearMonth":
        """今月のYearMonthを返す（JST基準）"""
        now = datetime.now(JST)
        return cls(now.year, now.month)

    def to_string(self) -> str:
        return f"{self.year:04d}-{self.month:02d}"

    def __str__(self) -> str:
        return self.to_string()


@dataclass(frozen=True)
class InvoiceAmount:
    """請求金額を表す値オブジェクト。0より大きい整数のみ許可。"""
    value: int

    def __post_init__(self) -> None:
        if self.value <= 0:
            raise InvalidAmountError(
                f"請求金額は0より大きい整数である必要があります: {self.value}"
            )


@dataclass(frozen=True)
class DueDate:
    """支払期日を表す値オブジェクト。"""
    value: date

    def is_within_reminder_range(self) -> bool:
        """今日から0〜3日以内の期日かどうか"""
        today = datetime.now(JST).date()
        delta = (self.value - today).days
        return 0 <= delta <= 3

    def is_overdue(self) -> bool:
        """今日より前（期日超過）かどうか"""
        today = datetime.now(JST).date()
        return self.value < today


@dataclass(frozen=True)
class IssueDate:
    """請求書発生日を表す値オブジェクト。未来日付は不可。"""
    value: date

    def __post_init__(self) -> None:
        today = datetime.now(JST).date()
        if self.value > today:
            raise InvalidIssueDateError(
                f"発生日に未来の日付は設定できません: {self.value}"
            )
