import { z } from "zod";
import { REGEX } from "@/lib/constants/regex";

export const articleSchema = z.object({
    title: z.string().min(1, "Article title is required"),
    link: z.string().regex(REGEX.URL, "Invalid URL (must include http:// or https://)"),
    image_url: z.string().regex(REGEX.URL, "Invalid Image URL").min(1, "Cover image is required"),
});

export const quizQuestionSchema = z.object({
    question: z.string().min(1, "Question text is required"),
    options: z.array(z.string().min(1, "Option text is required")).length(4),
    answer: z.string().min(1, "Correct answer is required"),
    explanation: z.string().optional(),
});

export const reflectionQuestionSchema = z.object({
    question: z.string().min(1, "Question text is required"),
    options: z.object({
        A: z.string().min(1, "Option A is required"),
        B: z.string().min(1, "Option B is required"),
        C: z.string().min(1, "Option C is required"),
        D: z.string().min(1, "Option D is required"),
    }),
    correct_answer: z.enum(["A", "B", "C", "D"]),
    explanation: z.string().optional(),
});

export const externalSubFactorSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Sub-factor name is required"),
    video_urls: z.array(z.string().regex(REGEX.YOUTUBE_URL, "Invalid YouTube URL")).default([]),
    articles: z.array(articleSchema).default([]),
    quiz: z.array(quizQuestionSchema).default([]),
});

export const internalVideoSubFactorSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Factor name is required"),
    video_urls: z.array(z.string().regex(REGEX.YOUTUBE_URL, "Invalid YouTube URL")).default([]),
});

export const internalDocumentSubFactorSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Internal factor name is required"),
    markdown: z.string().optional(),
    article_title: z.string().optional(),
    article_link: z.string().optional(),
    article_image_url: z.string().optional(),
    content_mode: z.enum(["markdown", "link"]),
}).superRefine((data, ctx) => {
    if (data.content_mode === "markdown") {
        if (!data.markdown || data.markdown.trim().length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Markdown content is required",
                path: ["markdown"],
            });
        }
    } else if (data.content_mode === "link") {
        if (!data.article_title || data.article_title.trim().length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Article title is required",
                path: ["article_title"],
            });
        }
        if (!data.article_link || !REGEX.URL.test(data.article_link)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Valid resource URL is required",
                path: ["article_link"],
            });
        }
        if (!data.article_image_url || !REGEX.URL.test(data.article_image_url)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Valid image URL is required",
                path: ["article_image_url"],
            });
        }
    }
});

export const groundingModuleStructureSchema = z.object({
    part_one: z.object({
        name: z.string().min(1, "Part I name is required"),
        weight: z.string().min(1, "Weight is required"),
        completion_assessment: z.object({
            type: z.string().min(1, "Assessment type is required"),
            description: z.string().min(1, "Assessment description is required"),
            quiz_questions: z.array(reflectionQuestionSchema).default([]),
        }),
        sub_factors: z.array(externalSubFactorSchema).default([]),
    }),
    part_two: z.object({
        name: z.string().min(1, "Part II name is required"),
        description: z.string().min(1, "Part II description is required"),
        video_section: z.object({
            title: z.string().min(1, "Video section title is required"),
            sub_factors: z.array(internalVideoSubFactorSchema).default([]),
        }),
        document_section: z.object({
            title: z.string().min(1, "Document section title is required"),
            factors: z.array(internalDocumentSubFactorSchema).default([]),
        }),
    }),
});

export const groundingModuleSchema = z.object({
    name: z.string().min(1, "Module name is required"),
    level: z.string().min(1, "Proficiency level is required"),
    description: z.string().min(1, "Module description is required"),
    company_id: z.string().optional(),
    structure: groundingModuleStructureSchema,
});
