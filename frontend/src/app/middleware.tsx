import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Todo : Add role checking ?
function authMiddleware(request: NextRequest) {


    const authenticatedUrls = [
        "/profile",
        "/article/*",
    ]

    // Exclure les requêtes pour les ressources statiques;
    if (
        request.nextUrl.pathname.startsWith("/_next/") || // Fichiers générés par Next.js
        request.nextUrl.pathname.startsWith("/static/")  // Fichiers statiques personnalisés
    ) {
        return NextResponse.next();
    }

    if (authenticatedUrls.some(url => request.nextUrl.pathname.startsWith(url))) {

        return NextResponse.redirect(new URL("/login", request.url));

    }

    return NextResponse.next();
}

export function middleware(request: NextRequest) {

    const isAuthenticated = request.cookies.has("token");

    // Todo : remove ? Alleviates the need to check every url if you're logged in but might not be useful
    if (isAuthenticated) {
        return authMiddleware(request);
    }
    
    return NextResponse.next();
}