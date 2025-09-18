import { Loader2 } from "lucide-react"

export function SplashScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-6">
      <div className="flex flex-col items-center space-y-8">
        {/* App Logo */}
        <div className="w-24 h-24 bg-primary rounded-2xl flex items-center justify-center">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
            <div className="w-6 h-6 bg-primary rounded-sm"></div>
          </div>
        </div>

        {/* App Name */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">FocusFlow</h1>
          <p className="text-muted-foreground text-lg">Productivity Made Simple</p>
        </div>

        {/* Loading Spinner */}
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    </div>
  )
}
