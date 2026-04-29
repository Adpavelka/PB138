import { t } from "elysia";
import { Uuid } from "./shared";

export const newspaperIdParam = t.Object({ newspaper_id: Uuid });

export const newspaperListResponse = t.Object({
	data: t.Array(
		t.Object({
			id: Uuid,
			name: t.String(),
			slug: t.String(),
		})
	),
});
