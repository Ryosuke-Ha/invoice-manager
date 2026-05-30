from domain.exceptions import TransportationAlreadyFixedError
from models import MonthlyTransportationSummary


class TransportationMergeDomainService:

    def can_merge(self, summary: MonthlyTransportationSummary) -> bool:
        """確定済みかどうかを判定"""
        return summary.is_fixed

    def validate_merge(self, summary: MonthlyTransportationSummary) -> None:
        """マージ可能でなければ TransportationAlreadyFixedError を raise"""
        if not self.can_merge(summary):
            raise TransportationAlreadyFixedError(
                "交通費が確定されていません。確定後に請求書へ反映してください。"
            )
