import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { textSubmissionSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const homeworkId = formData.get("homework_id") as string;
    const textContent = formData.get("text_content") as string | null;
    const photos = formData.getAll("photos") as File[];

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!homeworkId) {
      return NextResponse.json(
        { error: "Missing homework_id" },
        { status: 400 }
      );
    }

    const fileUrls: string[] = [];
    let submissionType: "photo" | "text" = "text";

    // Upload photos if present
    if (photos.length > 0) {
      submissionType = "photo";
      for (const photo of photos) {
        if (photo.size > 0) {
          const fileName = `${user.id}/${homeworkId}/${Date.now()}-${photo.name}`;
          const arrayBuffer = await photo.arrayBuffer();
          const { error: uploadError } = await supabase.storage
            .from("School")
            .upload(fileName, arrayBuffer, {
              contentType: photo.type,
              upsert: false,
            });

          if (!uploadError) {
            const {
              data: { publicUrl },
            } = supabase.storage.from("School").getPublicUrl(fileName);
            fileUrls.push(publicUrl);
          }
        }
      }
    }

    // Validate text submission
    if (submissionType === "text" && textContent) {
      const result = textSubmissionSchema.safeParse({
        homework_id: homeworkId,
        text_content: textContent,
      });
      if (!result.success) {
        return NextResponse.json(
          { error: result.error.issues[0].message },
          { status: 400 }
        );
      }
    }

    // Upsert submission
    const { error: insertError } = await supabase
      .from("submissions")
      .upsert({
        homework_id: homeworkId,
        student_id: user.id,
        submission_type: submissionType,
        file_urls: fileUrls.length > 0 ? fileUrls : null,
        text_content: submissionType === "text" ? textContent : null,
      });

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Submit homework error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}