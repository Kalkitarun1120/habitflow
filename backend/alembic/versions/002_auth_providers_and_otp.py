"""Add authentication providers and OTP verification

Revision ID: 002_auth_providers_and_otp
Revises: 001_initial_schema
Create Date: 2026-10-01 21:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector


# revision identifiers, used by Alembic.
revision: str = '002_auth_providers_and_otp'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    existing_tables = inspector.get_table_names()
    dialect_name = bind.dialect.name

    if dialect_name == "sqlite":
        bind.execute(sa.text("DROP TABLE IF EXISTS _alembic_tmp_users;"))

    # 1. Update users table columns if missing
    if 'users' in existing_tables:
        existing_cols = [c['name'] for c in inspector.get_columns('users')]
        if dialect_name == "sqlite":
            with op.batch_alter_table('users', schema=None) as batch_op:
                if 'phone_number' not in existing_cols:
                    batch_op.add_column(sa.Column('phone_number', sa.String(length=30), nullable=True))
                    batch_op.create_index(batch_op.f('ix_users_phone_number'), ['phone_number'], unique=True)
                if 'google_id' not in existing_cols:
                    batch_op.add_column(sa.Column('google_id', sa.String(length=255), nullable=True))
                    batch_op.create_index(batch_op.f('ix_users_google_id'), ['google_id'], unique=True)
                if 'is_email_verified' not in existing_cols:
                    batch_op.add_column(sa.Column('is_email_verified', sa.Boolean(), server_default='0', nullable=True))
                if 'is_phone_verified' not in existing_cols:
                    batch_op.add_column(sa.Column('is_phone_verified', sa.Boolean(), server_default='0', nullable=True))
                if 'auth_provider' not in existing_cols:
                    batch_op.add_column(sa.Column('auth_provider', sa.String(length=50), server_default='email', nullable=True))
                if 'last_login_at' not in existing_cols:
                    batch_op.add_column(sa.Column('last_login_at', sa.DateTime(), nullable=True))
                batch_op.alter_column('email', existing_type=sa.String(length=255), nullable=True)
                batch_op.alter_column('password_hash', existing_type=sa.String(length=255), nullable=True)
        else:
            # MySQL / PostgreSQL native operations
            if 'phone_number' not in existing_cols:
                op.add_column('users', sa.Column('phone_number', sa.String(length=30), nullable=True))
                op.create_index(op.f('ix_users_phone_number'), 'users', ['phone_number'], unique=True)
            if 'google_id' not in existing_cols:
                op.add_column('users', sa.Column('google_id', sa.String(length=255), nullable=True))
                op.create_index(op.f('ix_users_google_id'), 'users', ['google_id'], unique=True)
            if 'is_email_verified' not in existing_cols:
                op.add_column('users', sa.Column('is_email_verified', sa.Boolean(), server_default='0', nullable=True))
            if 'is_phone_verified' not in existing_cols:
                op.add_column('users', sa.Column('is_phone_verified', sa.Boolean(), server_default='0', nullable=True))
            if 'auth_provider' not in existing_cols:
                op.add_column('users', sa.Column('auth_provider', sa.String(length=50), server_default='email', nullable=True))
            if 'last_login_at' not in existing_cols:
                op.add_column('users', sa.Column('last_login_at', sa.DateTime(), nullable=True))
            op.alter_column('users', 'email', existing_type=sa.String(length=255), nullable=True)
            op.alter_column('users', 'password_hash', existing_type=sa.String(length=255), nullable=True)

    # 2. Create auth_identities table if not exists
    if 'auth_identities' not in existing_tables:
        op.create_table(
            'auth_identities',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('provider', sa.String(length=50), nullable=False),
            sa.Column('provider_user_id', sa.String(length=255), nullable=False),
            sa.Column('provider_email', sa.String(length=255), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('last_used_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('provider', 'provider_user_id', name='uq_provider_user_id')
        )
        op.create_index(op.f('ix_auth_identities_id'), 'auth_identities', ['id'], unique=False)
        op.create_index(op.f('ix_auth_identities_user_id'), 'auth_identities', ['user_id'], unique=False)

    # 3. Create otp_verifications table if not exists
    if 'otp_verifications' not in existing_tables:
        op.create_table(
            'otp_verifications',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=True),
            sa.Column('phone_number', sa.String(length=30), nullable=False),
            sa.Column('otp_hash', sa.String(length=255), nullable=False),
            sa.Column('purpose', sa.String(length=50), server_default='login', nullable=False),
            sa.Column('expires_at', sa.DateTime(), nullable=False),
            sa.Column('attempts', sa.Integer(), server_default='0', nullable=False),
            sa.Column('verified', sa.Boolean(), server_default='0', nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('used_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_otp_verifications_id'), 'otp_verifications', ['id'], unique=False)
        op.create_index(op.f('ix_otp_verifications_user_id'), 'otp_verifications', ['user_id'], unique=False)
        op.create_index(op.f('ix_otp_verifications_phone_number'), 'otp_verifications', ['phone_number'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_otp_verifications_phone_number'), table_name='otp_verifications')
    op.drop_index(op.f('ix_otp_verifications_user_id'), table_name='otp_verifications')
    op.drop_index(op.f('ix_otp_verifications_id'), table_name='otp_verifications')
    op.drop_table('otp_verifications')

    op.drop_index(op.f('ix_auth_identities_user_id'), table_name='auth_identities')
    op.drop_index(op.f('ix_auth_identities_id'), table_name='auth_identities')
    op.drop_table('auth_identities')

    bind = op.get_bind()
    dialect_name = bind.dialect.name

    if dialect_name == "sqlite":
        with op.batch_alter_table('users', schema=None) as batch_op:
            batch_op.drop_index(batch_op.f('ix_users_google_id'))
            batch_op.drop_index(batch_op.f('ix_users_phone_number'))
            batch_op.alter_column('password_hash', existing_type=sa.String(length=255), nullable=False)
            batch_op.alter_column('email', existing_type=sa.String(length=255), nullable=False)
            batch_op.drop_column('last_login_at')
            batch_op.drop_column('auth_provider')
            batch_op.drop_column('is_phone_verified')
            batch_op.drop_column('is_email_verified')
            batch_op.drop_column('google_id')
            batch_op.drop_column('phone_number')
    else:
        op.drop_index(op.f('ix_users_google_id'), table_name='users')
        op.drop_index(op.f('ix_users_phone_number'), table_name='users')
        op.alter_column('users', 'password_hash', existing_type=sa.String(length=255), nullable=False)
        op.alter_column('users', 'email', existing_type=sa.String(length=255), nullable=False)
        op.drop_column('users', 'last_login_at')
        op.drop_column('users', 'auth_provider')
        op.drop_column('users', 'is_phone_verified')
        op.drop_column('users', 'is_email_verified')
        op.drop_column('users', 'google_id')
        op.drop_column('users', 'phone_number')
