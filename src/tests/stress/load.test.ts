import { check, sleep } from "k6";
import http from "k6/http";

export const options = {
	scenarios: {
		constant_request_rate: {
			executor: "constant-arrival-rate",
			rate: 1700,
			timeUnit: "1s",
			duration: "1m",
			preAllocatedVUs: 100,
			maxVUs: 500,
		},
	},
	thresholds: {
		http_req_failed: ["rate<0.01"],
		http_req_duration: ["p(95)<150"],
	},
};

export default function () {
	const res = http.get("http://localhost:3000/api/todos");

	check(res, {
		"status is 200": (r) => r.status === 200,
		"body has success": (r) => {
			const body = r.json() as { success?: boolean };
			return body.success === true;
		},
	});

	sleep(0.1);
}
