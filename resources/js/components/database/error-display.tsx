import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ErrorDisplayProps {
    errorMessage: string | null;
}

const ErrorDisplay = ({ errorMessage }: ErrorDisplayProps) => {
    if (!errorMessage) {
        return null;
    }

    return (
        <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
    );
};

export default ErrorDisplay;
