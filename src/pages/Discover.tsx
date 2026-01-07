import { useState } from "react";
import { 
  Search, 
  TrendingUp, 
  Clock, 
  Sparkles, 
  Globe,
  ChevronRight,
  X
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PodcastCard from "@/components/cards/PodcastCard";
import CreatorCard from "@/components/cards/CreatorCard";
import { cn } from "@/lib/utils";

const Discover = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches] = useState(["AI Technology", "Productivity tips", "Business strategy"]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    { id: "technology", name: "Technology", color: "bg-blue-500" },
    { id: "business", name: "Business", color: "bg-green-500" },
    { id: "lifestyle", name: "Lifestyle", color: "bg-pink-500" },
    { id: "education", name: "Education", color: "bg-yellow-500" },
    { id: "entertainment", name: "Entertainment", color: "bg-purple-500" },
    { id: "health", name: "Health", color: "bg-red-500" },
    { id: "science", name: "Science", color: "bg-cyan-500" },
    { id: "arts", name: "Arts", color: "bg-orange-500" },
  ];

  const forYouPodcasts = [
    {
      title: "Building the Next Unicorn",
      creator: "Startup Stories",
      coverUrl: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=400&fit=crop",
      duration: "28:45",
      likes: 3421
    },
    {
      title: "Deep Work Strategies",
      creator: "Productivity Pro",
      coverUrl: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&h=400&fit=crop",
      duration: "19:33",
      likes: 2156
    },
    {
      title: "Climate Tech Revolution",
      creator: "Green Future",
      coverUrl: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&h=400&fit=crop",
      duration: "35:12",
      likes: 1879
    },
    {
      title: "The Psychology of Success",
      creator: "Mind Matters",
      coverUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
      duration: "22:08",
      likes: 2743
    }
  ];

  const trendingCreators = [
    {
      name: "Alex Morgan",
      username: "alextalks",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
      category: "Tech News",
      followers: 234000,
      totalListens: 8900000,
      isVerified: true
    },
    {
      name: "Jessica Liu",
      username: "jessicapod",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
      category: "Wellness",
      followers: 189000,
      totalListens: 6500000,
      isVerified: true
    },
    {
      name: "Michael Brooks",
      username: "mikebrooks",
      avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop",
      category: "Finance",
      followers: 156000,
      totalListens: 5200000,
      isVerified: false
    }
  ];

  const basedOnSearches = [
    {
      title: "Introduction to Machine Learning",
      creator: "AI Academy",
      coverUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=400&fit=crop",
      duration: "42:15",
      likes: 4521
    },
    {
      title: "GPT and the Future of Work",
      creator: "Tech Forward",
      coverUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=400&fit=crop",
      duration: "26:33",
      likes: 3298
    }
  ];

  return (
    <Layout showPlayer>
      <div className="container mx-auto px-4 py-6">
        {/* Search Header */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search podcasts, creators, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-10 h-12 bg-card border-border text-base"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => setSearchQuery("")}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Recent Searches */}
          {!searchQuery && recentSearches.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Recent Searches</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search) => (
                  <Badge
                    key={search}
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80"
                    onClick={() => setSearchQuery(search)}
                  >
                    {search}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Categories */}
        <section className="mb-12">
          <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Browse Categories
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                className={cn(
                  "glass-card-hover p-4 text-center transition-all",
                  selectedCategory === category.id && "ring-2 ring-primary"
                )}
              >
                <div className={cn("w-3 h-3 rounded-full mx-auto mb-2", category.color)} />
                <span className="font-medium text-sm">{category.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* For You Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              For You
            </h2>
            <Button variant="ghost" size="sm" className="gap-1">
              See all
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {forYouPodcasts.map((podcast, i) => (
              <PodcastCard key={i} {...podcast} />
            ))}
          </div>
        </section>

        {/* Based on Searches */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              Based on Your Searches
            </h2>
            <Button variant="ghost" size="sm" className="gap-1">
              See all
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {basedOnSearches.map((podcast, i) => (
              <PodcastCard key={i} {...podcast} variant="compact" className="!p-4" />
            ))}
          </div>
        </section>

        {/* Trending Creators */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Trending Creators
            </h2>
            <Button variant="ghost" size="sm" className="gap-1">
              See all
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingCreators.map((creator, i) => (
              <CreatorCard key={i} {...creator} />
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Discover;
