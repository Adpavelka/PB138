import { redis } from "bun";

const key = (jti: string) => `jwt:blocklist:${jti}`;

export async function blocklistJti(jti: string, ttlSeconds: number): Promise<void> {
	if (ttlSeconds <= 0)
		return;

	await redis.set(key(jti), "revoked", "EX", ttlSeconds);
}

export async function isJtiBlocklisted(jti: string): Promise<boolean> {
	return await redis.exists(key(jti));
}
