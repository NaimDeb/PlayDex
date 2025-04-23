"use client";
import { useState } from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import reportService from "@/lib/api/reportService";
import { addToast } from "@heroui/toast";
import { useRouter } from "next/navigation";

type Props = {
    reportableId: number;
    reportableEntity: string;
    successMessage: string;
    placeholder?: string;
};

export default function ReportForm({
    reportableId,
    reportableEntity,
    successMessage,
    placeholder = "Décrivez la raison de votre signalement",
}: Props) {
    const [reason, setReason] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);
        try {
            await reportService.postReport({
                reason,
                reportableId,
                reportableEntity,
            });
            addToast({
                title: "Signalement envoyé",
                description: successMessage,
                color: "success",
            });
            router.back();
        } catch {
            addToast({
                title: "Erreur",
                description: "Impossible d'envoyer le signalement.",
                color: "danger",
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex flex-col items-center w-full">
            <div
                className="bg-yellow-900 border-l-4 border-yellow-500 text-yellow-100 p-4 my-6 rounded-md flex items-start w-full max-w-2xl"
                role="alert"
            >
                <FaExclamationTriangle className="text-yellow-400 mr-3 mt-1 flex-shrink-0" size={24} />
                <div>
                    <p className="font-bold">Attention !</p>
                    <p className="text-sm">
                        Merci de ne signaler que les contenus réellement problématiques. Les abus peuvent entraîner des sanctions.
                    </p>
                </div>
            </div>
            <form
                className="space-y-6 w-full max-w-2xl bg-off-gray border border-gray-700 rounded-lg p-8 shadow flex flex-col"
                onSubmit={handleSubmit}
            >
                <fieldset disabled={isLoading} className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="reason" className="text-xl font-montserrat font-semibold">
                            Raison du signalement :
                        </label>
                        <textarea
                            id="reason"
                            name="reason"
                            rows={5}
                            required
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder={placeholder}
                            className="w-full p-3 border border-gray-600 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        />
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="bg-primary hover:bg-secondary text-white font-bold py-2 px-8 rounded transition duration-150 ease-in-out shadow"
                            disabled={isLoading}
                        >
                            {isLoading ? "Envoi..." : "Envoyer le signalement"}
                        </button>
                    </div>
                </fieldset>
            </form>
        </div>
    );
}