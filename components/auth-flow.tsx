"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, Loader2, AlertCircle } from "lucide-react"
import { useAuth } from "./auth-context"
import { toast } from "sonner"

interface AuthFlowProps {
  onComplete: () => void
}

type AuthScreen = "login" | "signup" | "profile"

export function AuthFlow({ onComplete }: AuthFlowProps) {
  const { login, register, updateProfile } = useAuth()
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>("login")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    phone: "",
    address: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setErrorMessage(null)
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!formData.email || !formData.password) {
      setErrorMessage("Please enter both email and password")
      return
    }

    try {
      setIsSubmitting(true)
      await login(formData.email, formData.password)
      toast.success("Welcome back!")
      onComplete()
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to sign in. Please check your credentials.")
      toast.error(err.message || "Sign in failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!formData.email || !formData.password) {
      setErrorMessage("Please fill in all required fields")
      return
    }

    if (formData.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long")
      return
    }

    try {
      setIsSubmitting(true)
      await register({
        email: formData.email,
        password: formData.password,
        username: formData.username || undefined,
      })
      toast.success("Account created successfully!")
      setCurrentScreen("profile")
    } catch (err: any) {
      setErrorMessage(err.message || "Registration failed")
      toast.error(err.message || "Registration failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleProfileComplete = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    try {
      setIsSubmitting(true)
      if (formData.phone || formData.address || formData.username) {
        await updateProfile({
          username: formData.username || undefined,
          phone: formData.phone || undefined,
          address: formData.address || undefined,
        })
      }
      toast.success("Profile setup complete!")
      onComplete()
    } catch (err: any) {
      setErrorMessage(err.message || "Profile update failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderLoginScreen = () => (
    <Card className="w-full max-w-sm mx-auto glass-card">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
        <p className="text-muted-foreground">Sign in to your Clop account</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {errorMessage && (
          <div className="flex items-center space-x-2 text-sm p-3 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="pl-10"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="pl-10 pr-10"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full h-12">
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            {isSubmitting ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="text-center text-sm pt-2">
          <span className="text-muted-foreground">Don't have an account? </span>
          <Button
            onClick={() => {
              setErrorMessage(null)
              setCurrentScreen("signup")
            }}
            variant="link"
            className="p-0 h-auto text-primary font-semibold"
          >
            Sign up
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderSignupScreen = () => (
    <Card className="w-full max-w-sm mx-auto glass-card">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
        <p className="text-muted-foreground">Join Clop productivity app today</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {errorMessage && (
          <div className="flex items-center space-x-2 text-sm p-3 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signup-username">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="signup-username"
                placeholder="Choose a username"
                className="pl-10"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="signup-email"
                type="email"
                placeholder="Enter your email"
                className="pl-10"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                className="pl-10 pr-10"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full h-12">
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            {isSubmitting ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        <div className="text-center text-sm pt-2">
          <span className="text-muted-foreground">Already have an account? </span>
          <Button
            onClick={() => {
              setErrorMessage(null)
              setCurrentScreen("login")
            }}
            variant="link"
            className="p-0 h-auto text-primary font-semibold"
          >
            Sign in
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderProfileScreen = () => (
    <Card className="w-full max-w-sm mx-auto glass-card">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Complete Profile</CardTitle>
        <p className="text-muted-foreground">Customize your profile info</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {errorMessage && (
          <div className="flex items-center space-x-2 text-sm p-3 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleProfileComplete} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-phone">Phone Number (Optional)</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="profile-phone"
                placeholder="Enter your phone number"
                className="pl-10"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-address">Address (Optional)</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="profile-address"
                placeholder="Enter your location"
                className="pl-10"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full h-12">
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            {isSubmitting ? "Saving..." : "Complete Setup & Go to App"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )

  return (
    <div className="flex flex-col min-h-screen bg-background px-6 py-8 justify-center page-transition">
      {currentScreen === "login" && renderLoginScreen()}
      {currentScreen === "signup" && renderSignupScreen()}
      {currentScreen === "profile" && renderProfileScreen()}
    </div>
  )
}
