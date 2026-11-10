import Link from "next/link";
import LogoIcon from "../ui/LogoIcon";

function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur-md border-b border-slate200">
      <div className="max-w-[1240px] mx-auto px-6 h-[68px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <LogoIcon />
          <span className="text-[18px] font-extrabold display-tight">
            BuildData
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-[13px] font-semibold text-slate600">
          <Link href="/" className="hover:text-primary">
            Producto
          </Link>
          <Link href="/payments" className="text-primary">
            Planes
          </Link>
          <Link href="/#casos" className="hover:text-primary">
            Casos
          </Link>
          <Link href="/#contacto" className="hover:text-primary">
            Contacto
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-[13px] font-bold text-slate700 hover:text-primary px-3 py-2"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/login"
            className="text-[13px] font-bold bg-primary hover:bg-primary-700 text-white rounded-md px-4 py-[8px] transition-colors"
          >
            Probar gratis
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
