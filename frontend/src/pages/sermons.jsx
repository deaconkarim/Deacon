import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Search, BookOpen, User, Calendar, Tag, PlayCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { loadFromLocalStorage, saveToLocalStorage, initializeData } from '@/lib/data';
import { parseRSSFeed } from '@/lib/rssUtils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
};

const SermonCard = ({ sermon }) => (
  <motion.div variants={itemVariants}>
    <Card className="overflow-hidden h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl line-clamp-2">{sermon.title}</CardTitle>
        {sermon.creator && (
          <CardDescription className="flex items-center text-sm">
            <User className="mr-1.5 h-4 w-4 text-muted-foreground" /> {sermon.creator}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pb-3 flex-grow">
        <div className="space-y-2">
          {sermon.pubDate && (
            <div className="flex items-center text-sm">
              <Calendar className="mr-1.5 h-4 w-4 text-muted-foreground" />
              {format(new Date(sermon.pubDate), 'MMM d, yyyy')}
            </div>
          )}
          {sermon.categories && sermon.categories.length > 0 && (
            <div className="flex items-center text-sm">
              <Tag className="mr-1.5 h-4 w-4 text-muted-foreground" />
              {sermon.categories.join(', ')}
            </div>
          )}
          {sermon.contentSnippet && (
            <p className="text-sm text-muted-foreground line-clamp-3">{sermon.contentSnippet}</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 py-3 border-t mt-auto flex justify-between items-center">
        {sermon.enclosure && sermon.enclosure.url && (
          <Button variant="outline" size="sm" asChild>
            <a href={sermon.enclosure.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
              <PlayCircle className="mr-2 h-4 w-4" /> Listen/Watch
            </a>
          </Button>
        )}
        <Button variant="ghost" size="sm" asChild>
          <a href={sermon.link} target="_blank" rel="noopener noreferrer">
            Read More
          </a>
        </Button>
      </CardFooter>
    </Card>
  </motion.div>
);

export function Sermons() {
  const [sermons, setSermons] = useState([]);
  const [filteredSermons, setFilteredSermons] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [speakerFilter, setSpeakerFilter] = useState('all');
  const [seriesFilter, setSeriesFilter] = useState('all');
  const [speakers, setSpeakers] = useState([]);
  const [series, setSeries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();

  const SERMONS_RSS_URL = 'https://www.blb.church/sermons/feed/';

  const fetchAndProcessSermons = useCallback(async () => {
    setIsLoading(true);
    toast({ title: "Fetching Sermons", description: "Attempting to retrieve sermons..." });

    try {
      const sermonFeed = await parseRSSFeed(SERMONS_RSS_URL);
      if (sermonFeed && sermonFeed.items) {
        const fetchedSermons = sermonFeed.items.map(item => ({
          id: item.guid || item.link || Date.now().toString() + Math.random().toString(),
          title: item.title || "Untitled Sermon",
          link: item.link,
          pubDate: item.pubDate || item.isoDate,
          creator: item.creator || (item['dc:creator'] ? item['dc:creator'] : 'Unknown Speaker'),
          contentSnippet: item.contentSnippet || item['itunes:summary'] || (item.contentEncoded ? item.contentEncoded.substring(0,150) : '') ,
          categories: item.categories || [],
          enclosure: item.enclosure,
        }));
        
        setSermons(fetchedSermons);
        saveToLocalStorage('sermons', fetchedSermons);
        toast({ title: "Sermons Updated", description: `${fetchedSermons.length} sermons fetched successfully.` });
      } else {
        toast({ title: "Failed to Fetch Sermons", description: "Could not retrieve sermon data. Using cached data if available.", variant: "destructive" });
        const cachedSermons = loadFromLocalStorage('sermons', []);
        setSermons(cachedSermons);
      }
    } catch (error) {
      console.error("Error fetching sermons:", error);
      toast({ title: "Error Fetching Sermons", description: `An error occurred: ${error.message}. Using cached data if available.`, variant: "destructive" });
      const cachedSermons = loadFromLocalStorage('sermons', []);
      setSermons(cachedSermons);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    initializeData();
    const cachedSermons = loadFromLocalStorage('sermons', []);
    if (cachedSermons.length > 0) {
      setSermons(cachedSermons);
      const uniqueSpeakers = [...new Set(cachedSermons.map(s => s.creator).filter(Boolean))].sort();
      setSpeakers(uniqueSpeakers);
      const uniqueSeries = [...new Set(cachedSermons.flatMap(s => s.categories || []).filter(Boolean))].sort();
      setSeries(uniqueSeries);
    }
    fetchAndProcessSermons();
  }, [fetchAndProcessSermons]);

  useEffect(() => {
    let filtered = [...sermons];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(sermon =>
        sermon.title.toLowerCase().includes(query) ||
        (sermon.creator && sermon.creator.toLowerCase().includes(query)) ||
        (sermon.contentSnippet && sermon.contentSnippet.toLowerCase().includes(query))
      );
    }

    if (speakerFilter !== 'all') {
      filtered = filtered.filter(sermon => sermon.creator === speakerFilter);
    }
    
    if (seriesFilter !== 'all') {
      filtered = filtered.filter(sermon => sermon.categories && sermon.categories.includes(seriesFilter));
    }

    filtered.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    setFilteredSermons(filtered);

    if (sermons.length > 0) {
        const uniqueSpeakers = [...new Set(sermons.map(s => s.creator).filter(Boolean))].sort();
        setSpeakers(uniqueSpeakers);
        const uniqueSeries = [...new Set(sermons.flatMap(s => s.categories || []).filter(Boolean))].sort();
        setSeries(uniqueSeries);
    }

  }, [sermons, searchQuery, speakerFilter, seriesFilter]);


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sermons</h1>
          <p className="text-muted-foreground">
            Browse and listen to past sermons.
          </p>
        </div>
        <Button onClick={fetchAndProcessSermons} disabled={isLoading}>
          {isLoading ? 'Refreshing...' : 'Refresh Sermons'}
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sermons by title, speaker, or content..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={speakerFilter} onValueChange={setSpeakerFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by Speaker" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Speakers</SelectItem>
              {speakers.map(speaker => (
                <SelectItem key={speaker} value={speaker}>{speaker}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={seriesFilter} onValueChange={setSeriesFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by Series/Tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Series/Tags</SelectItem>
              {series.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {isLoading && filteredSermons.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4 animate-pulse" />
          <h3 className="text-lg font-medium">Loading Sermons...</h3>
          <p className="text-muted-foreground mt-1">Please wait while we fetch the latest sermons.</p>
        </div>
      )}

      {!isLoading && filteredSermons.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No sermons found</h3>
          <p className="text-muted-foreground mt-1">
            {searchQuery || speakerFilter !== 'all' || seriesFilter !== 'all'
              ? "Try adjusting your search or filter criteria."
              : "No sermons available at the moment. Try refreshing or check the console for errors."}
          </p>
        </div>
      )}

      {filteredSermons.length > 0 && (
        <motion.div
          className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredSermons.map((sermon) => (
            <SermonCard key={sermon.id} sermon={sermon} />
          ))}
        </motion.div>
      )}
    </div>
  );
}