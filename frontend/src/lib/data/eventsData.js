const getFutureDate = (daysAhead = 30) => {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * daysAhead));
  return date;
};

export const eventsData = [
  {
    id: "1",
    title: "Sunday Worship Service",
    description: "Weekly worship service with praise, prayer, and sermon.",
    startDate: getFutureDate(7),
    endDate: new Date(getFutureDate(7).setHours(getFutureDate(7).getHours() + 2)),
    location: "Main Sanctuary",
    organizer: "Pastor David Wilson",
    attendees: 120,
    recurring: true,
    recurrencePattern: "weekly",
    type: "worship"
  },
  {
    id: "2",
    title: "Bible Study",
    description: "Weekly Bible study focusing on the Book of Romans.",
    startDate: getFutureDate(3),
    endDate: new Date(getFutureDate(3).setHours(getFutureDate(3).getHours() + 1.5)),
    location: "Fellowship Hall",
    organizer: "Elder Sarah Johnson",
    attendees: 25,
    recurring: true,
    recurrencePattern: "weekly",
    type: "study"
  },
  {
    id: "3",
    title: "Youth Group Meeting",
    description: "Weekly gathering for teenagers with games, worship, and Bible discussion.",
    startDate: getFutureDate(5),
    endDate: new Date(getFutureDate(5).setHours(getFutureDate(5).getHours() + 2)),
    location: "Youth Room",
    organizer: "Youth Pastor Michael Brown",
    attendees: 35,
    recurring: true,
    recurrencePattern: "weekly",
    type: "youth"
  },
  {
    id: "4",
    title: "Church Picnic",
    description: "Annual church picnic with food, games, and fellowship.",
    startDate: getFutureDate(20),
    endDate: new Date(getFutureDate(20).setHours(getFutureDate(20).getHours() + 4)),
    location: "City Park",
    organizer: "Events Committee",
    attendees: 150,
    recurring: false,
    recurrencePattern: null,
    type: "fellowship"
  },
  {
    id: "5",
    title: "Prayer Meeting",
    description: "Midweek prayer gathering for church and community needs.",
    startDate: getFutureDate(2),
    endDate: new Date(getFutureDate(2).setHours(getFutureDate(2).getHours() + 1)),
    location: "Prayer Chapel",
    organizer: "Prayer Team",
    attendees: 15,
    recurring: true,
    recurrencePattern: "weekly",
    type: "prayer"
  },
  {
    id: "6",
    title: "Worship Team Practice",
    description: "Weekly rehearsal for Sunday worship service.",
    startDate: getFutureDate(4),
    endDate: new Date(getFutureDate(4).setHours(getFutureDate(4).getHours() + 2)),
    location: "Sanctuary",
    organizer: "Worship Director Lisa Wilson",
    attendees: 12,
    recurring: true,
    recurrencePattern: "weekly",
    type: "music"
  },
  {
    id: "7",
    title: "Men's Breakfast",
    description: "Monthly men's fellowship breakfast with guest speaker.",
    startDate: getFutureDate(10),
    endDate: new Date(getFutureDate(10).setHours(getFutureDate(10).getHours() + 2)),
    location: "Fellowship Hall",
    organizer: "Men's Ministry",
    attendees: 30,
    recurring: true,
    recurrencePattern: "monthly",
    type: "fellowship"
  },
  {
    id: "8",
    title: "Women's Bible Study",
    description: "Weekly women's Bible study on the Book of Esther.",
    startDate: getFutureDate(6),
    endDate: new Date(getFutureDate(6).setHours(getFutureDate(6).getHours() + 1.5)),
    location: "Room 201",
    organizer: "Women's Ministry",
    attendees: 22,
    recurring: true,
    recurrencePattern: "weekly",
    type: "study"
  },
  {
    id: "9",
    title: "Community Outreach",
    description: "Monthly service project at local homeless shelter.",
    startDate: getFutureDate(15),
    endDate: new Date(getFutureDate(15).setHours(getFutureDate(15).getHours() + 3)),
    location: "Hope Shelter",
    organizer: "Outreach Committee",
    attendees: 18,
    recurring: true,
    recurrencePattern: "monthly",
    type: "outreach"
  },
  {
    id: "10",
    title: "Children's Ministry Training",
    description: "Quarterly training for children's ministry volunteers.",
    startDate: getFutureDate(25),
    endDate: new Date(getFutureDate(25).setHours(getFutureDate(25).getHours() + 4)),
    location: "Children's Wing",
    organizer: "Children's Director Jennifer Miller",
    attendees: 20,
    recurring: true,
    recurrencePattern: "quarterly",
    type: "training"
  }
];