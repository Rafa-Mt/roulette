const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

type SimpleFetchResponse<T> = {
  data: T;
} | {
  error: Error;
}

export class SimpleFetch {
  static async get<T>(endpoint: string): Promise<SimpleFetchResponse<T>> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`);
      if (!response.ok) {
        return {
          error: new Error(
            `Error fetching data from ${endpoint}: ${response.statusText}`
          ),
        };
      }
      const data = await response.json();
      return { data };
    } catch (err: any) {
      return {
        error: new Error(
          `Network error fetching data from ${endpoint}: ${err?.message || err}`
        ),
      };
    }
  }

  static async post<T>(
    endpoint: string,
    data: any
  ): Promise<SimpleFetchResponse<T>> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        return {
          error: new Error(
            `Error posting data to ${endpoint}: ${response.statusText}`
          ),
        };
      }
      const responseData = await response.json();
      return { data: responseData };
    } catch (err: any) {
      return {
        error: new Error(
          `Network error posting data to ${endpoint}: ${err?.message || err}`
        ),
      };
    }
  }
}
