"use client";

import {
  Brain,
  Eye,
  Rocket,
  ShieldCheck,
  MessageSquare,
  ListChecks,
  TrendingUp,
  Map,
  Sparkles,
  CheckCircle2,
  Plane,
  Search,
  CircleDot,
} from "lucide-react";

export function FeaturesSection() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Main Features Grid */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="text-center mb-6 sm:mb-8">
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Why Travel Agentic Planner?
          </h3>
          <p className="text-gray-600 text-sm sm:text-base">
            Experience the future of travel planning with AI agents
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-linear-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4">
              <Brain className="text-white w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
              Multi-Agent Intelligence
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              Master Agent orchestrates specialist agents (Transport, Stay, Food) working in parallel
              for comprehensive planning.
            </p>
            <div className="flex items-center space-x-2 flex-wrap gap-1">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Smart</span>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                Parallel
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-linear-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4">
              <Eye className="text-white w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Full Transparency</h4>
            <p className="text-sm text-gray-600 mb-3">
              Watch agents work in real-time with live activity timelines showing research, dispatch,
              and finalization stages.
            </p>
            <div className="flex items-center space-x-2 flex-wrap gap-1">
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Live</span>
              <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">
                Detailed
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-linear-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
              <Rocket className="text-white w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Lightning Fast</h4>
            <p className="text-sm text-gray-600 mb-3">
              Get complete itineraries in minutes, not hours. Our AI agents work 47% faster than
              traditional manual planning.
            </p>
            <div className="flex items-center space-x-2 flex-wrap gap-1">
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Fast</span>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                Efficient
              </span>
            </div>
          </div>
        </div>

        {/* State-First UX Highlight */}
        <div className="mt-6 sm:mt-8 bg-linear-to-r from-indigo-50 to-purple-50 rounded-2xl p-5 sm:p-6 border border-indigo-100">
          <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-500 rounded-xl flex items-center justify-center shrink-0">
              <ShieldCheck className="text-white w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 mb-2 text-sm sm:text-base">
                State-First UX Design
              </h4>
              <p className="text-xs sm:text-sm text-gray-700 mb-3">
                Never wonder what&apos;s already captured. See trip context, progress, and decisions
                alongside conversations with clear execution stages and task statuses.
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                <div className="bg-white rounded-lg p-2 sm:p-3 text-center">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 mx-auto mb-1" />
                  <p className="text-xs font-medium text-gray-900">Conversation</p>
                </div>
                <div className="bg-white rounded-lg p-2 sm:p-3 text-center">
                  <ListChecks className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 mx-auto mb-1" />
                  <p className="text-xs font-medium text-gray-900">Context</p>
                </div>
                <div className="bg-white rounded-lg p-2 sm:p-3 text-center">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600 mx-auto mb-1" />
                  <p className="text-xs font-medium text-gray-900">Activity</p>
                </div>
                <div className="bg-white rounded-lg p-2 sm:p-3 text-center">
                  <Map className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mx-auto mb-1" />
                  <p className="text-xs font-medium text-gray-900">Itinerary</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Visualization */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="text-center mb-6 sm:mb-8">
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">How It Works</h3>
          <p className="text-gray-600 text-sm sm:text-base">
            Six-stage agent workflow from clarification to completion
          </p>
        </div>

        <div className="relative">
          {/* Desktop: vertical timeline */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-linear-to-b from-indigo-300 via-purple-300 to-pink-300 transform -translate-x-1/2" />

          <div className="space-y-6 sm:space-y-8">
            {/* Stage 1 */}
            <div className="flex flex-col md:flex-row items-start md:items-center md:space-x-6">
              <div className="flex-1 md:text-right mb-4 md:mb-0">
                <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-1">1. Clarify</h4>
                <p className="text-xs sm:text-sm text-gray-600">
                  Master Agent asks questions to understand your trip requirements
                </p>
              </div>
              <div className="relative z-10 w-14 h-14 sm:w-16 sm:h-16 bg-linear-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shrink-0 mb-4 md:mb-0">
                <MessageSquare className="text-white w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div className="flex-1 hidden md:block" />
            </div>

            {/* Stage 2 */}
            <div className="flex flex-col md:flex-row items-start md:items-center md:space-x-6">
              <div className="flex-1 hidden md:block" />
              <div className="relative z-10 w-14 h-14 sm:w-16 sm:h-16 bg-linear-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shrink-0 mb-4 md:mb-0">
                <CheckCircle2 className="text-white w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div className="flex-1">
                <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-1">2. Confirm</h4>
                <p className="text-xs sm:text-sm text-gray-600">
                  Review and confirm trip details, preferences, and constraints
                </p>
              </div>
            </div>

            {/* Stage 3 */}
            <div className="flex flex-col md:flex-row items-start md:items-center md:space-x-6">
              <div className="flex-1 md:text-right mb-4 md:mb-0">
                <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-1">3. Dispatch</h4>
                <p className="text-xs sm:text-sm text-gray-600">
                  Master distributes tasks to specialist agents in parallel
                </p>
              </div>
              <div className="relative z-10 w-14 h-14 sm:w-16 sm:h-16 bg-linear-to-br from-pink-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shrink-0 mb-4 md:mb-0">
                <Plane className="text-white w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div className="flex-1 hidden md:block" />
            </div>

            {/* Stage 4 */}
            <div className="flex flex-col md:flex-row items-start md:items-center md:space-x-6">
              <div className="flex-1 hidden md:block" />
              <div className="relative z-10 w-14 h-14 sm:w-16 sm:h-16 bg-linear-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shrink-0 mb-4 md:mb-0">
                <Search className="text-white w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div className="flex-1">
                <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-1">4. Research</h4>
                <p className="text-xs sm:text-sm text-gray-600">
                  Transport, Stay, and Food agents research options simultaneously
                </p>
              </div>
            </div>

            {/* Stage 5 */}
            <div className="flex flex-col md:flex-row items-start md:items-center md:space-x-6">
              <div className="flex-1 md:text-right mb-4 md:mb-0">
                <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-1">5. Finalize</h4>
                <p className="text-xs sm:text-sm text-gray-600">
                  Master synthesizes findings into 2-3 complete itinerary options
                </p>
              </div>
              <div className="relative z-10 w-14 h-14 sm:w-16 sm:h-16 bg-linear-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shrink-0 mb-4 md:mb-0">
                <Sparkles className="text-white w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div className="flex-1 hidden md:block" />
            </div>

            {/* Stage 6 */}
            <div className="flex flex-col md:flex-row items-start md:items-center md:space-x-6">
              <div className="flex-1 hidden md:block" />
              <div className="relative z-10 w-14 h-14 sm:w-16 sm:h-16 bg-linear-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shrink-0 mb-4 md:mb-0">
                <CircleDot className="text-white w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div className="flex-1">
                <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-1">6. Completed</h4>
                <p className="text-xs sm:text-sm text-gray-600">
                  Select your preferred itinerary and start your journey
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="text-center mb-6 sm:mb-8">
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Loved by Travelers</h3>
          <p className="text-gray-600 text-sm sm:text-base">
            See what users say about AI-powered planning
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <TestimonialCard
            name="Sarah Mitchell"
            role="Frequent Traveler"
            avatar="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg"
            quote="The agent transparency is incredible! I can see exactly what each specialist is researching and how my itinerary comes together. Saved me hours of planning."
          />
          <TestimonialCard
            name="Marcus Chen"
            role="Business Traveler"
            avatar="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg"
            quote="Finally, a travel planner that understands context! The state-first UX means I never lose track of what's been decided. Multiple itinerary options are brilliant."
          />
          <TestimonialCard
            name="Elena Rodriguez"
            role="Family Vacations"
            avatar="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg"
            quote="Love watching the agents work in real-time! The parallel research means I get comprehensive plans quickly. Perfect for planning family trips with kids."
          />
        </div>
      </div>

      {/* CTA Section */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-md text-center">
        <div className="max-w-2xl mx-auto">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-linear-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <Rocket className="text-white w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Ready to Plan Smarter?
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            Join thousands of travelers using AI agents to create perfect itineraries in minutes. No
            credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <button className="w-full sm:w-auto bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl shadow-lg hover:shadow-xl transition">
              Start Planning Free
            </button>
            <button className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-700 font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl border-2 border-gray-200 transition">
              Watch Demo
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-white/80 text-xs sm:text-sm">
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-4">
          <a href="#" className="hover:text-white transition">
            About
          </a>
          <a href="#" className="hover:text-white transition">
            Privacy
          </a>
          <a href="#" className="hover:text-white transition">
            Terms
          </a>
          <a href="#" className="hover:text-white transition">
            Support
          </a>
          <a href="#" className="hover:text-white transition">
            API
          </a>
        </div>
        <p>© 2026 Travel Agentic Planner. All rights reserved.</p>
      </footer>
    </div>
  );
}

interface TestimonialCardProps {
  name: string;
  role: string;
  avatar: string;
  quote: string;
}

function TestimonialCard({ name, role, avatar, quote }: TestimonialCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
      <div className="flex items-center space-x-3 mb-4">
        <img
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
          src={avatar}
          alt={name}
          loading="lazy"
        />
        <div>
          <h5 className="font-semibold text-gray-900 text-sm sm:text-base">{name}</h5>
          <p className="text-xs text-gray-600">{role}</p>
        </div>
      </div>
      <div className="flex items-center space-x-1 mb-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <svg
            key={i}
            className="w-4 h-4 text-yellow-400 fill-current"
            viewBox="0 0 20 20"
          >
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        ))}
      </div>
      <p className="text-xs sm:text-sm text-gray-700">{quote}</p>
    </div>
  );
}
