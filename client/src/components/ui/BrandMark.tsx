/** Custom DormFix dormitory/D monogram. The same vector supplies every brand mark. */
export function BrandMark({ className = 'h-10 w-10' }: { className?: string }) {
    const image = `url("${import.meta.env.BASE_URL}dormfix-mark.svg")`;
    return <span aria-hidden="true" className={`df-logo-mark ${className}`}
        style={{ maskImage: image, WebkitMaskImage: image }} />;
}
