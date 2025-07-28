import sharp from "sharp";
import { supabase } from "..";

async function run() {
    const { data: drawings, error } = await supabase.storage
        .from("drawings")
        .list("", { limit: 50 });

    if (error) throw error;

    for (const file of drawings) {
        const { data: fileData, error: downloadError } = await supabase.storage
            .from("drawings")
            .download(file.name);

        if (downloadError) {
            console.error(`failed to download ${file.name}`, downloadError);
            continue;
        }

        if (!fileData) {
            console.error(`no data for ${file.name}`);
            continue;
        }

        const buffer = await fileData.arrayBuffer();
        if (buffer.byteLength === 0) {
            console.log(`skipping ${file.name} - empty file`);
            continue;
        }

        // add white bg
        const whiteBgBuffer = await sharp(buffer)
            .flatten({ background: "#ffffff" })
            .png()
            .toBuffer();

        // upload to sketches
        const { error: uploadError } = await supabase.storage
            .from("sketches")
            .upload(file.name, whiteBgBuffer, {
                contentType: "image/png",
                upsert: true,
            });

        if (uploadError) {
            console.error(`failed to upload ${file.name}`, uploadError);
        } else {
            console.log(`processed and uploaded: ${file.name}`);
        }
    }
}

run().catch(console.error);
