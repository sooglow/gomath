import { supabase } from "./supabase";
import type { Explanation } from "../types";

export type HintContext = {
    book: string;
    problem: string;
    problemId: string;
    userId: string;
    explanation: Explanation | null;
};

function compressImage(
    file: File,
    maxPx = 1024,
    quality = 0.7,
): Promise<{ base64: string; mimeType: string }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            let { width, height } = img;

            if (width > maxPx || height > maxPx) {
                if (width > height) {
                    height = Math.round((height * maxPx) / width);
                    width = maxPx;
                } else {
                    width = Math.round((width * maxPx) / height);
                    height = maxPx;
                }
            }
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
            URL.revokeObjectURL(url);
            const dataUrl = canvas.toDataURL("image/jpeg", quality);
            resolve({ base64: dataUrl.split(",")[1], mimeType: "image/jpeg" });
        };
        img.onerror = reject;
        img.src = url;
    });
}

export async function getHintFromImage(file: File, context: HintContext): Promise<string> {
    const { base64, mimeType } = await compressImage(file);
    const { data, error } = await supabase.functions.invoke("hint", {
        body: {
            problem_id: context.problemId,
            user_id: context.userId,
            message_type: "image",
            image_base64: base64,
            image_mime_type: mimeType,
        },
    });
    if (error) throw error;
    return data.hint;
}

export async function getHintFromText(userMessage: string, context: HintContext): Promise<string> {
    const { data, error } = await supabase.functions.invoke("hint", {
        body: {
            problem_id: context.problemId,
            user_id: context.userId,
            message_type: "text",
            user_message: userMessage,
        },
    });
    if (error) throw error;
    return data.hint;
}
