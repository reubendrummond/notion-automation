import * as d from "dotenv";
d.config();
import notion, { databaseId } from "./notion";

const dateFormatted = (date: Date = new Date()) =>
  new Date(date).toISOString().split("T")[0];

const getCompletedWorkouts = async (date: Date) => {
  const workoutsRes = await notion.databases.query({
    database_id: databaseId.workouts,
    filter: {
      and: [
        {
          property: "Date",
          date: {
            equals: dateFormatted(date),
          },
        },
        {
          property: "Duration",
          number: {
            greater_than: 0,
          },
        },
      ],
    },
  });

  workoutsRes.results.filter((w) => {});

  return workoutsRes;
};

const getDay = async (date: Date) => {
  // get day
  const day = await notion.databases.query({
    database_id: databaseId.day,
    filter: {
      property: "Date",
      date: {
        equals: dateFormatted(date),
      },
    },
  });

  return day;
};

const getDayOrCreate = async (date: Date) => {
  const dayRes = await getDay(date);

  if (dayRes.results.length) return dayRes.results[0];

  const newPageName = (date: Date) => {
    return `${("0" + date.getDate()).slice(-2)}.${(
      "0" +
      (date.getMonth() + 1)
    ).slice(-2)}.${date.getFullYear()}`;
  };

  const createPageRes = await notion.pages.create({
    parent: {
      database_id: databaseId.day,
    },
    properties: {
      Date: {
        date: {
          start: dateFormatted(date),
        },
      },
      Name: {
        title: [
          {
            text: {
              content: newPageName(date),
            },
          },
        ],
      },
    },
  });
  console.log("Page created");

  return (await getDay(date)).results[0];
};

async function updateWorkouts(date: Date): Promise<void>;
async function updateWorkouts(dates: Date[]): Promise<void>;
async function updateWorkouts(days: number): Promise<void>;
async function updateWorkouts(): Promise<void>;
async function updateWorkouts(d?: Date | Date[] | number): Promise<void> {
  let dates: Date[];
  // given array of dates to check
  if (Array.isArray(d)) dates = d;
  // one date given
  else if (d instanceof Date) dates = [d];
  // days to check given (today and d-1 previous days)
  else if (typeof d == "number" && d >= 0) {
    dates = Array.from(Array(d).keys()).map((i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d;
    });
  }
  // no args
  else dates = [new Date()];

  // get days and workouts
  const dayResPromises = Promise.all(dates.map((d) => getDayOrCreate(d)));
  const workoutResPromises = Promise.all(
    dates.map((d) => getCompletedWorkouts(d))
  );

  const [workoutsRes, dayRes] = await Promise.all([
    workoutResPromises,
    dayResPromises,
  ]);

  // update days with workouts
  const updatePromises = workoutsRes.map(async (wr, i) => {
    const updateResPromise = await notion.pages.update({
      page_id: dayRes[i].id,
      properties: {
        Workouts: {
          relation: wr.results.map((w) => ({ id: w.id })),
        },
      },
    });

    if (!wr.results.length) {
      console.log(`No workouts for day ${dateFormatted(dates[i])}`);
    } else {
      console.log(
        `${wr.results.length} workouts for day ${dateFormatted(dates[i])}`
      );
    }

    console.log(`${dateFormatted(dates[i])} successfully updated`);
  });

  await Promise.all(updatePromises);
}

const ensureDatabaseShemaValid = () => {};

updateWorkouts(3);

// notion.users.list({}).then(console.log);
