"""Add email column to otp_verifications for email OTP and recovery

Revision ID: 003_email_otp_and_profile_enhancements
Revises: 002_auth_providers_and_otp
Create Date: 2026-10-01 23:55:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector


# revision identifiers, used by Alembic.
revision: str = '003_email_otp_and_profile_enhancements'
down_revision: Union[str, None] = '002_auth_providers_and_otp'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    existing_tables = inspector.get_table_names()
    dialect_name = bind.dialect.name

    if 'otp_verifications' in existing_tables:
        existing_cols = [c['name'] for c in inspector.get_columns('otp_verifications')]
        if dialect_name == "sqlite":
            with op.batch_alter_table('otp_verifications', schema=None) as batch_op:
                if 'email' not in existing_cols:
                    batch_op.add_column(sa.Column('email', sa.String(length=255), nullable=True))
                    batch_op.create_index(batch_op.f('ix_otp_verifications_email'), ['email'], unique=False)
                batch_op.alter_column('phone_number', existing_type=sa.String(length=30), nullable=True)
        else:
            # MySQL / PostgreSQL
            if 'email' not in existing_cols:
                op.add_column('otp_verifications', sa.Column('email', sa.String(length=255), nullable=True))
                op.create_index(op.f('ix_otp_verifications_email'), 'otp_verifications', ['email'], unique=False)
            op.alter_column('otp_verifications', 'phone_number', existing_type=sa.String(length=30), nullable=True)


def downgrade() -> None:
    bind = op.get_bind()
    dialect_name = bind.dialect.name

    if dialect_name == "sqlite":
        with op.batch_alter_table('otp_verifications', schema=None) as batch_op:
            batch_op.drop_index(batch_op.f('ix_otp_verifications_email'))
            batch_op.drop_column('email')
    else:
        op.drop_index(op.f('ix_otp_verifications_email'), table_name='otp_verifications')
        op.drop_column('otp_verifications', 'email')
