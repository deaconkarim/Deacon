const getRandomDate = (daysBack = 365) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date;
};

export const donationsData = [
  {
    id: "1",
    memberId: "1",
    memberName: "John Smith",
    amount: 250.00,
    date: getRandomDate(30),
    category: "tithe",
    method: "check",
    notes: "Check #1234",
    taxDeductible: true
  },
  {
    id: "2",
    memberId: "3",
    memberName: "Michael Williams",
    amount: 500.00,
    date: getRandomDate(45),
    category: "building_fund",
    method: "online",
    notes: "",
    taxDeductible: true
  },
  {
    id: "3",
    memberId: "5",
    memberName: "David Jones",
    amount: 100.00,
    date: getRandomDate(15),
    category: "missions",
    method: "cash",
    notes: "",
    taxDeductible: true
  },
  {
    id: "4",
    memberId: "2",
    memberName: "Sarah Johnson",
    amount: 150.00,
    date: getRandomDate(60),
    category: "tithe",
    method: "online",
    notes: "Recurring monthly donation",
    taxDeductible: true
  },
  {
    id: "5",
    memberId: "7",
    memberName: "Robert Davis",
    amount: 75.00,
    date: getRandomDate(20),
    category: "youth_ministry",
    method: "check",
    notes: "Check #5678",
    taxDeductible: true
  },
  {
    id: "6",
    memberId: "9",
    memberName: "James Taylor",
    amount: 1000.00,
    date: getRandomDate(90),
    category: "building_fund",
    method: "online",
    notes: "",
    taxDeductible: true
  },
  {
    id: "7",
    memberId: "4",
    memberName: "Emily Brown",
    amount: 50.00,
    date: getRandomDate(10),
    category: "outreach",
    method: "cash",
    notes: "",
    taxDeductible: true
  },
  {
    id: "8",
    memberId: "8",
    memberName: "Lisa Wilson",
    amount: 200.00,
    date: getRandomDate(40),
    category: "tithe",
    method: "online",
    notes: "",
    taxDeductible: true
  },
  {
    id: "9",
    memberId: "10",
    memberName: "Mary Anderson",
    amount: 125.00,
    date: getRandomDate(25),
    category: "missions",
    method: "check",
    notes: "Check #9012",
    taxDeductible: true
  },
  {
    id: "10",
    memberId: "6",
    memberName: "Jennifer Miller",
    amount: 300.00,
    date: getRandomDate(55),
    category: "tithe",
    method: "online",
    notes: "",
    taxDeductible: true
  },
  {
    id: "11",
    memberId: "1",
    memberName: "John Smith",
    amount: 250.00,
    date: getRandomDate(5),
    category: "tithe",
    method: "online",
    notes: "Recurring monthly donation",
    taxDeductible: true
  },
  {
    id: "12",
    memberId: "3",
    memberName: "Michael Williams",
    amount: 150.00,
    date: getRandomDate(12),
    category: "outreach",
    method: "check",
    notes: "Check #3456",
    taxDeductible: true
  }
];