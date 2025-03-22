import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "@inertiajs/react";
import axios from "axios";
import { useEffect, useState } from "react";

interface TestConnectionResponse {
    success: boolean;
    error?: string;
}

const CreatePostgresConnection = ({ trigger }: { trigger: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [connectionString, setConnectionString] = useState("");
    const [connectionStringError, setConnectionStringError] = useState("");
    const [testingConnection, setTestingConnection] = useState(false);
    const [testConnectionResult, setTestConnectionResult] = useState<TestConnectionResponse | null>(null);

    const { post, data, setData, errors, processing, reset } = useForm({
        name: "",
        host: "",
        port: "5432",
        username: "",
        password: "",
        database: "",
    });

    useEffect(() => {
        if (!connectionString) {
            setConnectionStringError("");
            return;
        }

        try {
            const url = new URL(connectionString);

            if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
                throw new Error("Invalid protocol. Connection string must start with postgresql:// or postgres://");
            }

            if (!url.hostname) {
                throw new Error("Invalid host. Connection string must contain a host.");
            }

            const database = url.pathname.split("/")[1] || "";

            setData({
                name: database,
                host: url.hostname || "",
                port: url.port || "5432",
                username: url.username || "",
                password: url.password || "",
                database: database,
            });

            setConnectionStringError("");
        } catch {
            setConnectionStringError("Invalid connection string format. Expected: postgresql://username:password@host:port/database");
        }
    }, [connectionString, setData]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post(route("postgres.store"));

        reset();
        setIsOpen(false);
    };

    const testConnection = async () => {
        setTestingConnection(true);
        setTestConnectionResult(null);

        try {
            const response = await axios.post<TestConnectionResponse>(route("postgres.test-connection"), {
                host: data.host,
                port: data.port,
                username: data.username,
                password: data.password,
                database: data.database,
            });

            setTestConnectionResult(response.data);
        } catch {
            setTestConnectionResult({
                success: false,
                error: "Failed to test connection. Please try again.",
            });
        } finally {
            setTestingConnection(false);
        }
    };

    return (
        <ResponsiveDialog
            open={isOpen}
            onOpenChange={setIsOpen}
            trigger={trigger}
            title="Create Connection"
            description="Create a new connection to a Postgres database"
        >
            <Tabs defaultValue="connection-string" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="connection-string">Connection String</TabsTrigger>
                    <TabsTrigger value="form">Form</TabsTrigger>
                </TabsList>

                <TabsContent value="connection-string" className="py-4">
                    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-2">
                            <Label>Connection String</Label>
                            <Input
                                type="text"
                                placeholder="postgresql://username:password@host:port/database"
                                value={connectionString}
                                onChange={(e) => setConnectionString(e.target.value)}
                            />
                            {connectionStringError && <p className="text-red-500">{connectionStringError}</p>}
                        </div>

                        {testConnectionResult && (
                            <Alert variant={testConnectionResult.success ? "default" : "destructive"}>
                                <AlertDescription>
                                    {testConnectionResult.success ? "Connection successful!" : `Connection failed: ${testConnectionResult.error}`}
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="flex flex-col justify-end gap-2 md:flex-row">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={processing || testingConnection || !!connectionStringError}
                                onClick={testConnection}
                            >
                                {testingConnection ? "Testing..." : "Test Connection"}
                            </Button>
                            <Button type="submit" disabled={processing || !!connectionStringError}>
                                Create
                            </Button>
                            <Button type="button" variant="outline" disabled={processing} onClick={() => setIsOpen(false)}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </TabsContent>

                <TabsContent value="form">
                    <form className="flex flex-col gap-4 py-4" onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-2">
                            <Label>Name</Label>
                            <Input type="text" name="name" value={data.name} onChange={(e) => setData("name", e.target.value)} required />
                            {errors.name && <p className="text-red-500">{errors.name}</p>}
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>Host</Label>
                            <Input type="text" name="host" value={data.host} onChange={(e) => setData("host", e.target.value)} required />
                            {errors.host && <p className="text-red-500">{errors.host}</p>}
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>Port</Label>
                            <Input type="text" name="port" value={data.port} onChange={(e) => setData("port", e.target.value)} required />
                            {errors.port && <p className="text-red-500">{errors.port}</p>}
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>Database</Label>
                            <Input type="text" name="database" value={data.database} onChange={(e) => setData("database", e.target.value)} required />
                            {errors.database && <p className="text-red-500">{errors.database}</p>}
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>Username</Label>
                            <Input
                                type="text"
                                autoComplete="off"
                                name="username"
                                value={data.username}
                                onChange={(e) => setData("username", e.target.value)}
                                required
                            />
                            {errors.username && <p className="text-red-500">{errors.username}</p>}
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>Password</Label>
                            <Input
                                type="password"
                                name="password"
                                value={data.password}
                                onChange={(e) => setData("password", e.target.value)}
                                required
                            />
                            {errors.password && <p className="text-red-500">{errors.password}</p>}
                        </div>

                        {testConnectionResult && (
                            <Alert variant={testConnectionResult.success ? "default" : "destructive"}>
                                <AlertDescription>
                                    {testConnectionResult.success ? "Connection successful!" : `Connection failed: ${testConnectionResult.error}`}
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="flex flex-col justify-end gap-2 md:flex-row">
                            <Button type="button" variant="outline" disabled={processing || testingConnection} onClick={testConnection}>
                                {testingConnection ? "Testing..." : "Test Connection"}
                            </Button>
                            <Button type="submit" disabled={processing}>
                                Create
                            </Button>
                            <Button type="button" variant="outline" disabled={processing} onClick={() => setIsOpen(false)}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </TabsContent>
            </Tabs>
        </ResponsiveDialog>
    );
};

export default CreatePostgresConnection;
