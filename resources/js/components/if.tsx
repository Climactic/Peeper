const If = ({
    condition,
    children,
    fallback,
}: {
    condition: string | number | boolean | null | undefined;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}) => {
    if (condition) {
        return children;
    }
    return fallback ?? null;
};

export default If;
