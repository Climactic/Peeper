import { Button } from "@/components/ui/button";
import { CodeIcon } from "lucide-react";

/**
 * Button component for toggling between query mode and table view mode
 */
interface QueryToggleButtonProps {
    isQueryMode: boolean;
    onToggle: () => void;
}

const QueryToggleButton = ({ isQueryMode, onToggle }: QueryToggleButtonProps) => (
    <Button variant={isQueryMode ? "default" : "outline"} size="sm" onClick={onToggle} className="gap-2">
        <CodeIcon className="h-4 w-4" />
        {isQueryMode ? "Exit Query Mode" : "SQL Query Mode"}
    </Button>
);

export default QueryToggleButton;
