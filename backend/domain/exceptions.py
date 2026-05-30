class DomainError(Exception):
    """ドメインルール違反を表す基底例外"""
    pass


class InvalidStateTransitionError(DomainError):
    """不正な状態遷移"""
    pass


class AggregateNotFoundError(DomainError):
    """集約が見つからない"""
    pass


class BusinessRuleViolationError(DomainError):
    """ビジネスルール違反"""
    pass


# ここにアプリ固有の例外を追加


class InvoiceManagerError(Exception):
    """invoice-manager ドメイン基底例外"""
    pass


class InvalidAmountError(InvoiceManagerError):
    """請求金額が不正"""
    pass


class InvalidIssueDateError(InvoiceManagerError):
    """発生日が不正"""
    pass


class InvoiceAlreadyPaidError(InvoiceManagerError):
    """支払済み請求書への不正操作"""
    pass


class TransportationAlreadyFixedError(InvoiceManagerError):
    """確定済み交通費への不正操作"""
    pass


class AccountTitleInUseError(InvoiceManagerError):
    """使用中の勘定科目への削除操作"""
    pass


class InvalidStatusTransitionError(InvoiceManagerError):
    """不正なステータス遷移"""
    pass
