const getRandomDate = (daysBack = 365) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date;
};

export const attendanceData = {
  recent: [
    { date: getRandomDate(7), service: "Sunday Morning", count: 145 },
    { date: getRandomDate(14), service: "Sunday Morning", count: 152 },
    { date: getRandomDate(21), service: "Sunday Morning", count: 138 },
    { date: getRandomDate(28), service: "Sunday Morning", count: 149 }
  ],
  average: {
    weekly: 146,
    monthly: 580,
    quarterly: 1740
  },
  byService: [
    { name: "Sunday Morning", average: 146 },
    { name: "Sunday Evening", average: 85 },
    { name: "Wednesday Evening", average: 62 }
  ]
};