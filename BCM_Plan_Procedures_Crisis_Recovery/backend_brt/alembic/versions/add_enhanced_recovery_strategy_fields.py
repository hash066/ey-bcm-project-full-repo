"""Add enhanced recovery strategy fields

Revision ID: add_enhanced_recovery_strategy_fields
Revises: update_highest_impact_column_type
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

# revision identifiers, used by Alembic.
revision = 'add_enhanced_recovery_strategy_fields'
down_revision = 'update_highest_impact_column_type'
branch_labels = None
depends_on = None


def upgrade():
    """
    Upgrade database schema to add new recovery strategy features.
    """
    print("\n" + "="*70)
    print("UPGRADING: Adding Recovery Strategy Enhancements")
    print("="*70 + "\n")
    
    # ========================================================================
    # Step 1: Add new columns to recovery_strategies table
    # ========================================================================
    
    print("📝 Adding new columns to recovery_strategies table...")
    
    try:
        # Add process vulnerability fields
        op.add_column('recovery_strategies', 
            sa.Column('process_vulnerability_strategy', sa.Text(), nullable=True))
        
        op.add_column('recovery_strategies', 
            sa.Column('process_vulnerability_reasoning', sa.Text(), nullable=True))
        
        op.add_column('recovery_strategies', 
            sa.Column('process_vulnerability_status', sa.String(50), nullable=True, server_default='Not Implemented'))
        
        # Add configuration fields - FIXED: Using server_default instead of default
        op.add_column('recovery_strategies', 
            sa.Column('enabled_strategies', sa.String(255), nullable=True, server_default='people,technology,site,vendor,vulnerability'))
        
        # Add AI tracking fields
        op.add_column('recovery_strategies', 
            sa.Column('ai_generated_sections', sa.Text(), nullable=True))
        
        op.add_column('recovery_strategies', 
            sa.Column('ai_last_updated', sa.DateTime(timezone=True), nullable=True))
        
        print("✅ Successfully added columns to recovery_strategies\n")
        
    except Exception as e:
        print(f"⚠️  Warning adding columns: {str(e)}\n")
    
    # ========================================================================
    # Step 2: Create department_recovery_config table
    # ========================================================================
    
    print("📝 Creating department_recovery_config table...")
    
    try:
        op.create_table('department_recovery_config',
            # FIXED: Added id column as primary key
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
            sa.Column('department_id', postgresql.UUID(as_uuid=True), nullable=False, unique=True),
            
            # Template fields
            sa.Column('people_template', sa.Text(), nullable=True),
            sa.Column('technology_template', sa.Text(), nullable=True),
            sa.Column('site_template', sa.Text(), nullable=True),
            sa.Column('vendor_template', sa.Text(), nullable=True),
            sa.Column('vulnerability_template', sa.Text(), nullable=True),
            
            # AI configuration - FIXED: Using server_default
            sa.Column('enable_ai_generation', sa.Boolean(), nullable=True, server_default='true'),
            sa.Column('ai_generation_frequency', sa.String(50), nullable=True, server_default='on_demand'),
            
            # Strategy enablement - FIXED: Using server_default
            sa.Column('enabled_strategies', sa.String(255), nullable=True, 
                     server_default='people,technology,site,vendor,vulnerability'),
            
            # Timestamps
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
            
            # Foreign key and constraints
            sa.ForeignKeyConstraint(['department_id'], ['department.id'], ondelete='CASCADE'),
            sa.UniqueConstraint('department_id', name='uq_department_recovery_config_department_id')
        )
        
        # Create index for faster lookups
        op.create_index('idx_dept_recovery_config_dept_id', 'department_recovery_config', ['department_id'])
        
        print("✅ Successfully created department_recovery_config table\n")
        
    except Exception as e:
        print(f"⚠️  Warning creating table: {str(e)}\n")
    
    print("="*70)
    print("✅ MIGRATION COMPLETED SUCCESSFULLY!")
    print("="*70)
    print("\n📋 New features added:")
    print("   • Process vulnerability strategy (strategy, reasoning, status)")
    print("   • AI generation tracking (sections + timestamp)")
    print("   • Strategy enablement configuration")
    print("   • Department-level recovery configuration table")
    print("\n🚀 Next steps:")
    print("   1. Add GROK_API_KEY to .env file")
    print("   2. Restart FastAPI server")
    print("   3. Test: GET /recovery-strategies/test")
    print("   4. Generate: POST /recovery-strategies/generate-missing")
    print("="*70 + "\n")


def downgrade():
    """
    Downgrade database schema (rollback changes).
    """
    print("\n" + "="*70)
    print("DOWNGRADING: Rolling back recovery strategy enhancements")
    print("="*70 + "\n")
    
    # Drop department_recovery_config table
    print("📝 Dropping department_recovery_config table...")
    try:
        op.drop_index('idx_dept_recovery_config_dept_id', table_name='department_recovery_config')
        op.drop_table('department_recovery_config')
        print("✅ Dropped department_recovery_config\n")
    except Exception as e:
        print(f"⚠️  Warning: {str(e)}\n")
    
    # Remove columns from recovery_strategies table
    print("📝 Removing columns from recovery_strategies...")
    try:
        op.drop_column('recovery_strategies', 'ai_last_updated')
        op.drop_column('recovery_strategies', 'ai_generated_sections')
        op.drop_column('recovery_strategies', 'enabled_strategies')
        op.drop_column('recovery_strategies', 'process_vulnerability_status')
        op.drop_column('recovery_strategies', 'process_vulnerability_reasoning')
        op.drop_column('recovery_strategies', 'process_vulnerability_strategy')
        print("✅ Removed all new columns\n")
    except Exception as e:
        print(f"⚠️  Warning: {str(e)}\n")
    
    print("="*70)
    print("✅ ROLLBACK COMPLETED!")
    print("="*70 + "\n")
