import {isPostgres,storeEnv} from '../db/platform-store';

/**
 * Atomic employee lockout. Only a separately authenticated, active owner
 * may invoke this helper. It is NOT an authorization boundary by itself.
 * One PostgreSQL statement atomically blocks the account, revokes passkeys,
 * removes sessions, revokes pending invitations and denies QR requests approved by this user.
 */
export async function revokeEmployeeAccess(targetUserId:string):Promise<boolean>{
 if(!isPostgres())throw new Error('PostgreSQL required');
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId))
  return false;
 const {DB}=await storeEnv();
 const result=await DB.prepare(`
 WITH blocked AS (
  UPDATE skp_admin_users
  SET status='blocked',blocked_at=now(),updated_at=now()
  WHERE id=?::uuid AND role='admin' AND status='active'
  RETURNING id
 ),
 revoked AS (
  UPDATE skp_admin_passkeys
  SET revoked_at=now()
  WHERE user_id IN (SELECT id FROM blocked) AND revoked_at IS NULL
  RETURNING credential_id
 ),
 revoked_invites AS (
  UPDATE skp_admin_employee_invites
  SET revoked_at=now()
  WHERE user_id IN (SELECT id FROM blocked)
   AND consumed_at IS NULL AND revoked_at IS NULL
  RETURNING id
 ),
 deleted_sessions AS (
  DELETE FROM skp_admin_sessions_v2
  WHERE user_id IN (SELECT id FROM blocked)
  RETURNING token_hash
 ),
 denied_qr AS (
  UPDATE skp_admin_qr_requests
  SET status='denied'
  WHERE status IN ('pending','approved')
   AND (approved_user_id IN (SELECT id FROM blocked)
    OR approved_credential_id IN (SELECT credential_id FROM revoked))
  RETURNING request_hash
 ),
 audit AS (
  INSERT INTO skp_admin_security_events(target_user_id,event_type,details)
  SELECT id,'user_blocked','{}'::jsonb FROM blocked
  RETURNING id
 )
 SELECT EXISTS(SELECT 1 FROM blocked) AS blocked,
  (SELECT count(*) FROM revoked) AS revoked_count,
  (SELECT count(*) FROM deleted_sessions) AS session_count,
  (SELECT count(*) FROM revoked_invites) AS invite_count,
  (SELECT count(*) FROM denied_qr) AS qr_count,
  (SELECT count(*) FROM audit) AS audit_count
 `).bind(targetUserId).first<{blocked:boolean}>();
 return result?.blocked===true;
}
