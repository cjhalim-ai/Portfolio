import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingBag, Clock, TrendingDown, Leaf, Brain } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-8 w-8 text-green-600 dark:text-green-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">MindfulCart</h1>
          </div>
          <Button asChild data-testid="button-login">
            <a href="/api/login">Sign In</a>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4" data-testid="badge-tagline">
            Mindful Consumption for Better Living
          </Badge>
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Shop with Intention,
            <br />
            <span className="text-green-600 dark:text-green-400">Save with Purpose</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            MindfulCart helps you pause before purchasing by implementing thoughtful review cycles. 
            Track items you want, schedule reviews, and celebrate the money you save by choosing mindfully.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild data-testid="button-get-started">
              <a href="/api/login">Get Started Free</a>
            </Button>
            <Button variant="outline" size="lg" data-testid="button-learn-more">
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card data-testid="card-feature-spaced-reviews">
            <CardHeader>
              <Clock className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
              <CardTitle>Spaced Review System</CardTitle>
              <CardDescription>
                Schedule reviews at increasing intervals to help you reflect on purchases before committing.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card data-testid="card-feature-money-saved">
            <CardHeader>
              <TrendingDown className="h-12 w-12 text-green-600 dark:text-green-400 mb-4" />
              <CardTitle>Celebrate Savings</CardTitle>
              <CardDescription>
                Track money saved from items you chose not to buy. Feel good about mindful decisions.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card data-testid="card-feature-ai-insights">
            <CardHeader>
              <Brain className="h-12 w-12 text-purple-600 dark:text-purple-400 mb-4" />
              <CardTitle>AI-Powered Insights</CardTitle>
              <CardDescription>
                Get price tracking, product alternatives, and sustainability analysis to inform your decisions.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card data-testid="card-feature-organization">
            <CardHeader>
              <ShoppingBag className="h-12 w-12 text-orange-600 dark:text-orange-400 mb-4" />
              <CardTitle>Smart Organization</CardTitle>
              <CardDescription>
                Organize items into folders and categories. Track review progress and completion status.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card data-testid="card-feature-sustainability">
            <CardHeader>
              <Leaf className="h-12 w-12 text-green-600 dark:text-green-400 mb-4" />
              <CardTitle>Sustainability Focus</CardTitle>
              <CardDescription>
                Consider environmental impact and discover eco-friendly alternatives to promote conscious consumption.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card data-testid="card-feature-positive-mindset">
            <CardHeader>
              <Heart className="h-12 w-12 text-pink-600 dark:text-pink-400 mb-4" />
              <CardTitle>Positive Reinforcement</CardTitle>
              <CardDescription>
                Celebrate mindful choices with encouraging messaging that reinforces sustainable shopping habits.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* How It Works */}
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            How MindfulCart Works
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center" data-testid="step-add-items">
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">1</span>
              </div>
              <h4 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Add Items</h4>
              <p className="text-gray-600 dark:text-gray-300">
                Save items you're considering purchasing with details like price, description, and review schedule.
              </p>
            </div>
            <div className="text-center" data-testid="step-review-reflect">
              <div className="bg-green-100 dark:bg-green-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">2</span>
              </div>
              <h4 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Review & Reflect</h4>
              <p className="text-gray-600 dark:text-gray-300">
                Receive scheduled reviews to reconsider purchases. Answer thoughtful questions about necessity and value.
              </p>
            </div>
            <div className="text-center" data-testid="step-celebrate-choices">
              <div className="bg-purple-100 dark:bg-purple-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">3</span>
              </div>
              <h4 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Celebrate Choices</h4>
              <p className="text-gray-600 dark:text-gray-300">
                Archive items you decide against and see your savings grow. Feel good about mindful consumption.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <Card className="text-center py-12" data-testid="card-cta">
          <CardContent>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Start Your Mindful Shopping Journey
            </h3>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Join thousands making more intentional purchasing decisions
            </p>
            <Button size="lg" asChild data-testid="button-start-now">
              <a href="/api/login">Start Now - It's Free</a>
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-16 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2024 MindfulCart. Built for conscious consumers.</p>
        </div>
      </footer>
    </div>
  );
}