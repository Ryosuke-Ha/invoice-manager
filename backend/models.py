from database import Base  # noqa: F401

# ここにアプリ固有のSQLAlchemyモデルを追加
#
# 設計方針:
# - モデルはデータの保持のみ。ビジネスロジックはAPIレイヤーに書く
# - 全テーブルにidカラム（Integer, primary_key）を持たせる
# - 日時カラムはDateTimeを使い、JSTで扱う（UTCで保存してもJSTで返す）
# - Enumはdomain/enums.pyのものを使う（文字列のハードコード禁止）
#
# 例:
# from sqlalchemy import Column, Integer, String, DateTime
# from sqlalchemy.sql import func
#
# class Item(Base):
#     __tablename__ = "items"
#
#     id = Column(Integer, primary_key=True, index=True)
#     title = Column(String, nullable=False)
#     created_at = Column(DateTime(timezone=True), server_default=func.now())
#     updated_at = Column(DateTime(timezone=True), onupdate=func.now())
