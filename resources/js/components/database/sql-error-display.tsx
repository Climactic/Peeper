import If from "@/components/if";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * Component for displaying SQL query errors in a structured format
 */
interface SqlErrorDisplayProps {
    errorMessage: string;
}

const SqlErrorDisplay = ({ errorMessage }: SqlErrorDisplayProps) => {
    if (!errorMessage) return null;

    // Extract main error and query
    const parts = errorMessage.split("\n");
    const mainError = parts[0];
    let queryParts: string[] = [];
    let details: string[] = [];

    // Find the query part and separate it from other details
    const queryIndex = parts.findIndex((part) => part.startsWith("Your query:"));

    if (queryIndex !== -1) {
        // Split into details (before query) and query parts
        details = parts.slice(1, queryIndex);
        queryParts = parts.slice(queryIndex);
    } else {
        // No query found, just split normally
        details = parts.slice(1);
    }

    return (
        <div className="p-4">
            <Alert variant="destructive">
                <AlertTitle className="flex items-center font-mono font-bold">SQL Query Error</AlertTitle>
                <AlertDescription className="mt-2 space-y-3">
                    <div className="text-sm font-medium whitespace-pre-wrap">{mainError}</div>

                    {details.length > 0 && (
                        <div className="bg-primary/10 mt-2 rounded p-2 font-mono text-xs whitespace-pre-wrap text-gray-200">
                            {details.map((detail, i) => (
                                <div key={i} className="mt-1 first:mt-0">
                                    {detail}
                                </div>
                            ))}
                        </div>
                    )}

                    {queryParts.length > 0 && (
                        <div className="mt-3 space-y-1">
                            <div className="text-xs font-semibold uppercase">{queryParts[0]}</div>
                            <If condition={queryParts.length > 1}>
                                <pre className="bg-primary/10 max-h-[200px] overflow-auto rounded p-2 text-xs whitespace-pre-wrap">
                                    {queryParts.slice(1).join("\n")}
                                </pre>
                            </If>
                        </div>
                    )}
                </AlertDescription>
            </Alert>
        </div>
    );
};

export default SqlErrorDisplay;
