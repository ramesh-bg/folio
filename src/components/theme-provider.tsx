import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
    children: React.ReactNode
    defaultTheme?: Theme
    defaultThemeHue?: string
    storageKey?: string
}

type ThemeProviderState = {
    theme: Theme
    setTheme: (theme: Theme) => void
    themeHue: string
    setThemeHue: (hue: string) => void
}

const initialState: ThemeProviderState = {
    theme: "dark",
    setTheme: () => null,
    themeHue: "120",
    setThemeHue: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
    children,
    defaultTheme = "dark",
    defaultThemeHue = "120",
    storageKey = "vite-ui-theme",
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
    )
    const [themeHue, setThemeHue] = useState<string>(
        () => localStorage.getItem(`${storageKey}-hue`) || defaultThemeHue
    )

    useEffect(() => {
        const root = window.document.documentElement

        root.classList.remove("light", "dark")

        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
                .matches
                ? "dark"
                : "light"

            root.classList.add(systemTheme)
        } else {
            root.classList.add(theme)
        }
    }, [theme])

    useEffect(() => {
        const root = window.document.documentElement
        root.style.setProperty('--theme-hue', themeHue)
    }, [themeHue])

    const value = {
        theme,
        setTheme: (theme: Theme) => {
            localStorage.setItem(storageKey, theme)
            setTheme(theme)
        },
        themeHue,
        setThemeHue: (hue: string) => {
            localStorage.setItem(`${storageKey}-hue`, hue)
            setThemeHue(hue)
        }
    }

    return (
        <ThemeProviderContext.Provider value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext)

    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider")

    return context
}
