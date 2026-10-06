import { BrandMark } from './BrandMark';

export function Brand() {
    return <span className="inline-flex items-center gap-2.5 text-primary">
        <BrandMark />
        <span className="font-serif text-xl font-semibold tracking-tight">DormFix</span>
    </span>;
}
