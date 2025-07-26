// this function gets all the users from `auth.users` and creates a profile for each user in `profiles`.
// because supabase doesn't let me access `auth.users` directly idk why

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function syncProfiles() {
    // get users ahh
    const { data: users, error: userErr } =
        await supabase.auth.admin.listUsers();
    if (userErr) throw userErr;

    for (const user of users.users) {
        const id = user.id;
        const rawUserMeta = user.user_metadata;

        // check if profile already exists
        const { data: existing, error: checkErr } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", id)
            .single();

        if (checkErr && checkErr.code !== "PGRST116") {
            throw checkErr;
        }

        if (!existing) {
            // insert profile if not exists
            const { error: insertErr } = await supabase
                .from("profiles")
                .insert({
                    id,
                    raw_user_meta_data: rawUserMeta,
                    updated_at: new Date().toISOString(),
                });

            console.log(`- added profile for ${user.email}`);

            if (insertErr) throw insertErr;
        }
    }

    console.log("profiles synced yay");
}

syncProfiles().catch(console.error);
