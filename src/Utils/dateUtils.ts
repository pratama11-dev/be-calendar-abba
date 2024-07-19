import moment from "moment";

export class DateUtil {
    static CurDate() {
        return moment().toISOString();
    }
}