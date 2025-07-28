// this function gets all the users from `auth.users` and creates a profile for each user in `profiles`.
// because supabase doesn't let me access `auth.users` directly idk why

import { supabase } from "..";

async function run() {
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

run().catch(console.error);
