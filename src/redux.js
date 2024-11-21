import { createSlice, configureStore } from "@reduxjs/toolkit";

// 전체 행 개수 및 초기 데이터 생성
const ROWS = 1000000;
const initialData = Array.from({ length: ROWS }, (_, index) => ({
  ROW: index + 1, // 행 번호
  A: null, // A열 값
  B: null, // B열 값
  C: null, // C열 값
  isBEdited: false, // B열 값 직접 수정 여부 플래그
  isCEdited: false, // C열 값 직접 수정 여부 플래그
}));

// Redux Slice 생성
const tableSlice = createSlice({
  name: "table",
  // 초기 상태
  initialState: { 
    data: {}, // 테이블 데이터 (가상 스크롤링에 필요한 범위만 유지)
    visibleRows: { start: 0, end: 50 }, // 렌더링할 행의 범위
    a_value: null, // A열 1행 값
  },
  reducers: {
    // 현재 렌더링할 행의 범위를 설정
    setVisibleRows: (state, action) => {
      const { start, end } = action.payload;
      state.visibleRows = { start, end };
      // 지정된 범위 내 데이터 초기화 (없으면 추가)
      for (let i = start; i < end; i++) {
        if (!state.data[i]) {
          state.data[i] = { ...initialData[i] };
        }
      }
    },

    // A열 1행 값 설정
    setAValue: (state, action) => {
      state.a_value = action.payload;
    },

    // A열 값 업데이트
    updateA: (state, action) => {
      const { rowIndex, start, end, a_value } = action.payload;

      if (rowIndex === 0) {
        // A열 1행이 변경된 경우 visibleRows 범위 내 B, C열 값 계산
        state.data[0].A = a_value || state.data[0].A; // A열 1행 값 업데이트
        for (let i = start; i < end; i++) {
          if (!state.data[i]) continue; // 데이터가 없으면 건너뜀
          if (!state.data[i].isBEdited) {
            // B열 값 계산
            state.data[i].B = (a_value || 0) + (state.data[i - 1]?.B || 0);
          }
          if (!state.data[i].isCEdited) {
            // C열 값 계산
            state.data[i].C = (state.data[i].A || 0) + (state.data[i].B || 0);
          }
        }
      } else {
        // 특정 행의 A열 값이 변경된 경우
        const currentRow = state.data[rowIndex];
        if (!currentRow) return; // 데이터가 없으면 건너뜀
        currentRow.A = a_value; // A열 값 업데이트
        if (!currentRow.isCEdited) {
          // C열 값 계산
          currentRow.C = (currentRow.A || 0) + (currentRow.B || 0);
        }
      }
    },

    // B열 값 업데이트
    updateB: (state, action) => {
      const { rowIndex, value, end } = action.payload;
      const currentRow = state.data[rowIndex];
      if (!currentRow) return; // 데이터가 없으면 건너뜀
      currentRow.B = value; // B열 값 업데이트
      currentRow.isBEdited = true; // B열 값 직접 수정 플래그 설정
      currentRow.C = value || 0; // C열 같은 행 업데이트

      // B열 변경 이후 아래 행들 계산
      for (let i = rowIndex + 1; i < end; i++) {
        if (!state.data[i]) continue; // 데이터가 없으면 건너뜀
        if (!state.data[i].isBEdited) {
          // B열 값 계산
          state.data[i].B = (state.a_value || 0) + (state.data[i - 1]?.B || 0);
        }
        if (!state.data[i].isCEdited) {
          // C열 값 계산
          state.data[i].C = (state.data[i].A || 0) + (state.data[i].B || 0);
        }
      }
    },

    // C열 값 업데이트
    updateC: (state, action) => {
      const { rowIndex, value } = action.payload;
      const currentRow = state.data[rowIndex];
      if (!currentRow) return; // 데이터가 없으면 건너뜀
      currentRow.C = value; // C열 값 업데이트
      currentRow.isCEdited = true; // C열 값 직접 수정 플래그 설정
    },
  },
});

export const { updateA, updateB, updateC, setVisibleRows, setAValue } = tableSlice.actions;

export const store = configureStore({
  reducer: {
    table: tableSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // 직렬화 검사 비활성화 (성능 향상을 위해)
    }),
});