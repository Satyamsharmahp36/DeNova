use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("H9oXVRXYTJEm4wHrSYnARhrARrBoUwAs1jTCvshXxbrU");

#[program]
pub mod chatmate {
    use super::*;

    /// Initialize an assistant profile on-chain
    pub fn initialize_assistant(
        ctx: Context<InitializeAssistant>,
        username: String,
        access_fee: u64,  // Fee in lamports (0 = free access)
    ) -> Result<()> {
        let assistant = &mut ctx.accounts.assistant;
        assistant.owner = ctx.accounts.owner.key();
        assistant.username = username;
        assistant.access_fee = access_fee;
        assistant.total_earnings = 0;
        assistant.is_access_restricted = false;
        assistant.bump = ctx.bumps.assistant;
        
        emit!(AssistantCreated {
            owner: assistant.owner,
            username: assistant.username.clone(),
            access_fee,
        });
        
        Ok(())
    }

    /// Update assistant settings
    pub fn update_assistant(
        ctx: Context<UpdateAssistant>,
        access_fee: Option<u64>,
        is_access_restricted: Option<bool>,
    ) -> Result<()> {
        let assistant = &mut ctx.accounts.assistant;
        
        if let Some(fee) = access_fee {
            assistant.access_fee = fee;
        }
        
        if let Some(restricted) = is_access_restricted {
            assistant.is_access_restricted = restricted;
        }
        
        Ok(())
    }

    /// Grant access permission to a user
    pub fn grant_access(
        ctx: Context<GrantAccess>,
        visitor_pubkey: Pubkey,
        permission_type: PermissionType,
        expires_at: Option<i64>,  // Unix timestamp, None = permanent
    ) -> Result<()> {
        let permission = &mut ctx.accounts.permission;
        permission.assistant = ctx.accounts.assistant.key();
        permission.visitor = visitor_pubkey;
        permission.permission_type = permission_type;
        permission.granted_at = Clock::get()?.unix_timestamp;
        permission.expires_at = expires_at;
        permission.is_active = true;
        permission.bump = ctx.bumps.permission;
        
        emit!(AccessGranted {
            assistant: permission.assistant,
            visitor: visitor_pubkey,
            permission_type,
        });
        
        Ok(())
    }

    /// Revoke access permission
    pub fn revoke_access(ctx: Context<RevokeAccess>) -> Result<()> {
        let permission = &mut ctx.accounts.permission;
        permission.is_active = false;
        
        emit!(AccessRevoked {
            assistant: permission.assistant,
            visitor: permission.visitor,
        });
        
        Ok(())
    }

    /// Pay to connect - visitor pays assistant owner for access
    pub fn pay_for_access(ctx: Context<PayForAccess>) -> Result<()> {
        let assistant = &ctx.accounts.assistant;
        let fee = assistant.access_fee;
        
        require!(fee > 0, ChatmateError::NoFeeRequired);
        
        // Transfer SOL from visitor to assistant owner
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.visitor.to_account_info(),
                to: ctx.accounts.assistant_owner.to_account_info(),
            },
        );
        system_program::transfer(cpi_context, fee)?;
        
        // Update assistant earnings
        let assistant = &mut ctx.accounts.assistant;
        assistant.total_earnings = assistant.total_earnings.checked_add(fee).unwrap();
        
        // Create or update permission
        let permission = &mut ctx.accounts.permission;
        permission.assistant = assistant.key();
        permission.visitor = ctx.accounts.visitor.key();
        permission.permission_type = PermissionType::Chat;
        permission.granted_at = Clock::get()?.unix_timestamp;
        permission.expires_at = None;  // Permanent after payment
        permission.is_active = true;
        permission.paid_amount = fee;
        permission.bump = ctx.bumps.permission;
        
        emit!(PaymentReceived {
            assistant: assistant.key(),
            visitor: ctx.accounts.visitor.key(),
            amount: fee,
        });
        
        Ok(())
    }

    /// Tip an assistant (no access granted, just appreciation)
    pub fn tip_assistant(ctx: Context<TipAssistant>, amount: u64) -> Result<()> {
        require!(amount > 0, ChatmateError::InvalidAmount);
        
        // Transfer SOL from tipper to assistant owner
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.tipper.to_account_info(),
                to: ctx.accounts.assistant_owner.to_account_info(),
            },
        );
        system_program::transfer(cpi_context, amount)?;
        
        // Update assistant earnings
        let assistant = &mut ctx.accounts.assistant;
        assistant.total_earnings = assistant.total_earnings.checked_add(amount).unwrap();
        
        emit!(TipReceived {
            assistant: assistant.key(),
            tipper: ctx.accounts.tipper.key(),
            amount,
        });
        
        Ok(())
    }

    /// Check if a visitor has valid permission
    pub fn check_permission(ctx: Context<CheckPermission>) -> Result<bool> {
        let permission = &ctx.accounts.permission;
        
        if !permission.is_active {
            return Ok(false);
        }
        
        // Check expiration
        if let Some(expires_at) = permission.expires_at {
            let now = Clock::get()?.unix_timestamp;
            if now > expires_at {
                return Ok(false);
            }
        }
        
        Ok(true)
    }
}

// ============== Account Structures ==============

#[account]
#[derive(Default)]
pub struct Assistant {
    pub owner: Pubkey,           // 32 bytes - wallet that owns this assistant
    pub username: String,        // 4 + 32 bytes max
    pub access_fee: u64,         // 8 bytes - fee in lamports for access
    pub total_earnings: u64,     // 8 bytes - total SOL earned
    pub is_access_restricted: bool, // 1 byte
    pub bump: u8,                // 1 byte
}

impl Assistant {
    pub const MAX_SIZE: usize = 32 + (4 + 32) + 8 + 8 + 1 + 1 + 8; // + 8 for discriminator
}

#[account]
#[derive(Default)]
pub struct Permission {
    pub assistant: Pubkey,       // 32 bytes
    pub visitor: Pubkey,         // 32 bytes
    pub permission_type: PermissionType, // 1 byte
    pub granted_at: i64,         // 8 bytes
    pub expires_at: Option<i64>, // 1 + 8 bytes
    pub is_active: bool,         // 1 byte
    pub paid_amount: u64,        // 8 bytes - amount paid for this permission
    pub bump: u8,                // 1 byte
}

impl Permission {
    pub const MAX_SIZE: usize = 32 + 32 + 1 + 8 + 9 + 1 + 8 + 1 + 8;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Default)]
pub enum PermissionType {
    #[default]
    Chat,           // Can chat with assistant
    Schedule,       // Can schedule meetings
    FullAccess,     // All permissions
}

// ============== Context Structures ==============

#[derive(Accounts)]
#[instruction(username: String)]
pub struct InitializeAssistant<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + Assistant::MAX_SIZE,
        seeds = [b"assistant", owner.key().as_ref()],
        bump
    )]
    pub assistant: Account<'info, Assistant>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateAssistant<'info> {
    #[account(
        mut,
        seeds = [b"assistant", owner.key().as_ref()],
        bump = assistant.bump,
        has_one = owner
    )]
    pub assistant: Account<'info, Assistant>,
    
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(visitor_pubkey: Pubkey)]
pub struct GrantAccess<'info> {
    #[account(
        seeds = [b"assistant", owner.key().as_ref()],
        bump = assistant.bump,
        has_one = owner
    )]
    pub assistant: Account<'info, Assistant>,
    
    #[account(
        init_if_needed,
        payer = owner,
        space = 8 + Permission::MAX_SIZE,
        seeds = [b"permission", assistant.key().as_ref(), visitor_pubkey.as_ref()],
        bump
    )]
    pub permission: Account<'info, Permission>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RevokeAccess<'info> {
    #[account(
        seeds = [b"assistant", owner.key().as_ref()],
        bump = assistant.bump,
        has_one = owner
    )]
    pub assistant: Account<'info, Assistant>,
    
    #[account(
        mut,
        seeds = [b"permission", assistant.key().as_ref(), permission.visitor.as_ref()],
        bump = permission.bump
    )]
    pub permission: Account<'info, Permission>,
    
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct PayForAccess<'info> {
    /// CHECK: This is the assistant owner who receives payment - verified by constraint
    #[account(mut)]
    pub assistant_owner: AccountInfo<'info>,
    
    #[account(
        mut,
        seeds = [b"assistant", assistant_owner.key().as_ref()],
        bump = assistant.bump,
        constraint = assistant.owner == assistant_owner.key() @ ChatmateError::InvalidOwner
    )]
    pub assistant: Account<'info, Assistant>,
    
    #[account(
        init_if_needed,
        payer = visitor,
        space = 8 + Permission::MAX_SIZE,
        seeds = [b"permission", assistant.key().as_ref(), visitor.key().as_ref()],
        bump
    )]
    pub permission: Account<'info, Permission>,
    
    #[account(mut)]
    pub visitor: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TipAssistant<'info> {
    #[account(
        mut,
        seeds = [b"assistant", assistant_owner.key().as_ref()],
        bump = assistant.bump
    )]
    pub assistant: Account<'info, Assistant>,
    
    /// CHECK: This is the assistant owner who receives the tip
    #[account(mut, address = assistant.owner)]
    pub assistant_owner: AccountInfo<'info>,
    
    #[account(mut)]
    pub tipper: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CheckPermission<'info> {
    pub assistant: Account<'info, Assistant>,
    pub permission: Account<'info, Permission>,
}

// ============== Events ==============

#[event]
pub struct AssistantCreated {
    pub owner: Pubkey,
    pub username: String,
    pub access_fee: u64,
}

#[event]
pub struct AccessGranted {
    pub assistant: Pubkey,
    pub visitor: Pubkey,
    pub permission_type: PermissionType,
}

#[event]
pub struct AccessRevoked {
    pub assistant: Pubkey,
    pub visitor: Pubkey,
}

#[event]
pub struct PaymentReceived {
    pub assistant: Pubkey,
    pub visitor: Pubkey,
    pub amount: u64,
}

#[event]
pub struct TipReceived {
    pub assistant: Pubkey,
    pub tipper: Pubkey,
    pub amount: u64,
}

// ============== Errors ==============

#[error_code]
pub enum ChatmateError {
    #[msg("No fee required for this assistant")]
    NoFeeRequired,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Permission expired")]
    PermissionExpired,
    #[msg("Access denied")]
    AccessDenied,
    #[msg("Invalid owner")]
    InvalidOwner,
}
