"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const d = require("dotenv");
d.config();
const notion_1 = require("./notion");
const dateFormatted = (date = new Date()) => new Date(date).toISOString().split("T")[0];
const getCompletedWorkouts = (date) => __awaiter(void 0, void 0, void 0, function* () {
    const workoutsRes = yield notion_1.default.databases.query({
        database_id: notion_1.databaseId.workouts,
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
    workoutsRes.results.filter((w) => { });
    return workoutsRes;
});
const getDay = (date) => __awaiter(void 0, void 0, void 0, function* () {
    const day = yield notion_1.default.databases.query({
        database_id: notion_1.databaseId.day,
        filter: {
            property: "Date",
            date: {
                equals: dateFormatted(date),
            },
        },
    });
    return day;
});
const getDayOrCreate = (date) => __awaiter(void 0, void 0, void 0, function* () {
    const dayRes = yield getDay(date);
    if (dayRes.results.length)
        return dayRes.results[0];
    const newPageName = (date) => {
        return `${("0" + date.getDate()).slice(-2)}.${("0" +
            (date.getMonth() + 1)).slice(-2)}.${date.getFullYear()}`;
    };
    const createPageRes = yield notion_1.default.pages.create({
        parent: {
            database_id: notion_1.databaseId.day,
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
    return (yield getDay(date)).results[0];
});
function updateWorkouts(d) {
    return __awaiter(this, void 0, void 0, function* () {
        let dates;
        if (Array.isArray(d))
            dates = d;
        else if (d instanceof Date)
            dates = [d];
        else if (typeof d == "number" && d >= 0) {
            dates = Array.from(Array(d).keys()).map((i) => {
                const d = new Date();
                d.setDate(d.getDate() - i);
                return d;
            });
        }
        else
            dates = [new Date()];
        const dayResPromises = Promise.all(dates.map((d) => getDayOrCreate(d)));
        const workoutResPromises = Promise.all(dates.map((d) => getCompletedWorkouts(d)));
        const [workoutsRes, dayRes] = yield Promise.all([
            workoutResPromises,
            dayResPromises,
        ]);
        const updatePromises = workoutsRes.map((wr, i) => __awaiter(this, void 0, void 0, function* () {
            const updateResPromise = yield notion_1.default.pages.update({
                page_id: dayRes[i].id,
                properties: {
                    Workouts: {
                        relation: wr.results.map((w) => ({ id: w.id })),
                    },
                },
            });
            if (!wr.results.length) {
                console.log(`No workouts for day ${dateFormatted(dates[i])}`);
            }
            else {
                console.log(`${wr.results.length} workouts for day ${dateFormatted(dates[i])}`);
            }
            console.log(`${dateFormatted(dates[i])} successfully updated`);
        }));
        yield Promise.all(updatePromises);
    });
}
const ensureDatabaseShemaValid = () => { };
updateWorkouts(3);
