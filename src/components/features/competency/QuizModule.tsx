"use client";

import React, { useState } from "react";
import {
    CheckSquare,
    CheckCircle2,
    ChevronRight,
    Circle,
    AlertCircle,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { QuizQuestion } from "@/types";

interface QuizModuleProps {
    questions: QuizQuestion[];
    onPass: (score: number) => void;
    onFail?: () => void;
    activePhase: string;
    initialScore?: number | null;
}

export const QuizModule: React.FC<QuizModuleProps> = ({
    questions,
    onPass,
    onFail,
    activePhase,
    initialScore
}) => {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState(initialScore !== undefined && initialScore !== null);
    const [showResultModal, setShowResultModal] = useState(false);
    const [score, setScore] = useState(initialScore !== undefined && initialScore !== null ? (initialScore / 100) * questions.length : 0);

    const handleSubmit = () => {
        const correctCount = questions.filter(
            (q) => answers[q.question] === q.answer
        ).length;
        const ratio = correctCount / questions.length;
        const passed = ratio >= 0.75; // 15 out of 20 ratio = 75%

        setScore(correctCount);
        setSubmitted(true);
        setShowResultModal(true);

        if (passed) {
            // Logic for passing is handled after they close the modal or click proceed
        }
    };

    const handleProceed = () => {
        setShowResultModal(false);
        const ratio = score / questions.length;
        if (ratio >= 0.75) {
            onPass(score);
        } else {
            setSubmitted(false);
            setAnswers({});
            if (onFail) onFail();
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1B4332]/5 mb-4">
                        <CheckSquare className="w-8 h-8 text-[#C5A059]" />
                    </div>
                    <h3 className="text-3xl font-serif italic mb-2 capitalize">
                        {activePhase} Progress Quiz
                    </h3>
                    {submitted ? (
                        <div className="space-y-4">
                            <p className="text-green-600 font-bold flex items-center justify-center gap-2">
                                <CheckCircle2 className="w-5 h-5" /> Quiz Completed
                            </p>
                            <div className="bg-white p-6 rounded-3xl border border-[#E8E4D8] inline-block shadow-sm">
                                <p className="text-lg font-medium text-[#1B4332]">
                                    Your Score: <span className="text-[#C5A059] font-bold">{score}</span> / {questions.length} ({(score / questions.length * 100).toFixed(0)}%)
                                </p>
                            </div>
                            <div>
                                <button
                                    onClick={() => setSubmitted(false)}
                                    className="text-sm font-bold text-[#1B4332]/60 hover:text-primary underline transition-colors"
                                >
                                    Review Your Answers
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-[#1B4332]/50 text-sm">
                            Verify your understanding to unlock the next phase (Requires 75% to pass).
                        </p>
                    )}
                </div>

                {!submitted ? (
                    <>
                        {questions.map((q, idx) => (
                            <div
                                key={idx}
                                className="space-y-4 p-8 rounded-3xl bg-[#FDFCF6] border border-[#E8E4D8]"
                            >
                                <p className="font-bold text-lg leading-snug">
                                    <span className="text-[#C5A059] mr-2">Q{idx + 1}.</span>
                                    {q.question}
                                </p>
                                <div className="space-y-3">
                                    {q.options.map((option) => (
                                        <button
                                            key={option}
                                            onClick={() =>
                                                !submitted &&
                                                setAnswers((prev) => ({ ...prev, [q.question]: option }))
                                            }
                                            className={cn(
                                                "w-full text-left p-5 rounded-2xl border transition-all text-sm flex items-center justify-between group",
                                                answers[q.question] === option
                                                    ? "border-[#1B4332] bg-[#1B4332] text-white shadow-lg"
                                                    : "border-[#E8E4D8] hover:border-[#1B4332]/30 bg-white text-[#1B4332]",
                                                submitted &&
                                                option === q.answer &&
                                                "border-green-500 bg-green-500 text-white",
                                                submitted &&
                                                answers[q.question] === option &&
                                                option !== q.answer &&
                                                "border-red-500 bg-red-500 text-white"
                                            )}
                                        >
                                            <span className="font-medium">{option}</span>
                                            {answers[q.question] === option && !submitted && (
                                                <Circle className="w-4 h-4 fill-current opacity-20" />
                                            )}
                                            {submitted && option === q.answer && (
                                                <CheckCircle2 className="w-5 h-5" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <div className="pt-6">
                            <button
                                onClick={handleSubmit}
                                disabled={Object.keys(answers).length < questions.length || submitted}
                                className="w-full bg-[#1B4332] text-white py-5 rounded-2xl font-bold uppercase tracking-widest hover:bg-[#1B4332]/90 transition-all shadow-xl disabled:opacity-20 disabled:cursor-not-allowed group"
                            >
                                Verify Understanding
                                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-12">
                        <CheckCircle2 className="w-20 h-20 text-green-500/20 mx-auto mb-6" />
                        <p className="text-[#1B4332]/60 max-w-sm mx-auto">
                            You have successfully completed this quiz. You can re-read the articles or watch the videos again, or proceed to the next available phase.
                        </p>
                    </div>
                )}
            </div>

            {/* Result Modal */}
            {showResultModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1B4332]/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] shadow-2xl max-w-md w-full p-10 relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-2 bg-[#C5A059]" />

                        <div className="text-center space-y-6">
                            <div className={cn(
                                "w-20 h-20 rounded-full mx-auto flex items-center justify-center shadow-inner",
                                (score / questions.length) >= 0.75 ? "bg-green-50" : "bg-red-50"
                            )}>
                                {(score / questions.length) >= 0.75 ? (
                                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                                ) : (
                                    <AlertCircle className="w-10 h-10 text-red-500" />
                                )}
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-3xl font-serif italic text-[#1B4332]">
                                    {(score / questions.length) >= 0.75 ? "Excellent Work!" : "Room to Grow"}
                                </h4>
                                <p className="text-[#1B4332]/60 font-medium">
                                    You scored <span className="text-[#C5A059] font-bold">{score}</span> out of <span className="text-[#1B4332] font-bold">{questions.length}</span>
                                </p>
                            </div>

                            <div className="p-6 bg-[#FDFCF6] rounded-3xl border border-[#E8E4D8]">
                                <p className="text-sm leading-relaxed text-[#1B4332]/80 italic">
                                    {(score / questions.length) >= 0.75
                                        ? `Congratulations! You've mastered the ${activePhase} phase and are ready to proceed.`
                                        : `You need at least 75% to pass. Review the ${activePhase} material and try again.`}
                                </p>
                            </div>

                            <button
                                onClick={handleProceed}
                                className={cn(
                                    "w-full py-5 rounded-2xl font-bold uppercase tracking-[0.2em] transition-all shadow-xl",
                                    (score / questions.length) >= 0.75
                                        ? "bg-[#1B4332] text-white hover:bg-[#1B4332]/90"
                                        : "bg-[#C5A059] text-white hover:bg-[#C5A059]/90"
                                )}
                            >
                                {(score / questions.length) >= 0.75 ? "Enter Next Phase" : "Review Material"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
