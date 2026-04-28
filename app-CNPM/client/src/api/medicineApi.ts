import axios from "axios";

const API = "http://localhost:3000/api/medicines";

function getHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

// GET
export const getMedicines = (status: "active" | "deleted" | "all") => {
  return axios.get(API, {
    params: { status },
    headers: getHeaders(),
  });
};

// CREATE
export const createMedicine = (data: FormData) => {
  return axios.post(API, data, { headers: getHeaders() });
};

// UPDATE
export const updateMedicine = (id: number, data: FormData) => {
  return axios.patch(`${API}/${id}`, data, { headers: getHeaders() });
};

// DELETE
export const deleteMedicine = (id: number) => {
  return axios.patch(`${API}/${id}/delete`, {}, { headers: getHeaders() });
};

export const restoreMedicine = (id: number) => {
  return axios.patch(`${API}/${id}/restore`, {}, { headers: getHeaders() });
};
