import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateA, updateB, updateC, setVisibleRows, setAValue } from "./redux";
import "./App.css";

const ROWS = 1000000; // 전체 행 개수
const ROW_INCREMENT = 50; // 스크롤할 때마다 추가 렌더링할 행의 개수

// 테이블의 각 행 컴포넌트, 재렌더링 방지 위해 memo 사용
const TableRow = React.memo(({ row, rowIndex, handleInputChange, handleKeyDown, handleBlur, editingValue }) => (
  <tr>
    <td>{row.ROW}</td>
    {/* A열 */}
    <td>
      <input
        type="number"
        value={
          editingValue[`${rowIndex}-A`] !== undefined
            ? editingValue[`${rowIndex}-A`]
            : row.A ?? ""
        }
        onChange={(e) => handleInputChange(e, rowIndex, "A")}
        onKeyDown={(e) => handleKeyDown(e, rowIndex, "A")}
        onBlur={() => handleBlur(rowIndex, "A")}
      />
    </td>
    {/* B열 */}
    <td>
      <input
        type="number"
        value={
          editingValue[`${rowIndex}-B`] !== undefined
            ? editingValue[`${rowIndex}-B`]
            : row.B ?? ""
        }
        onChange={(e) => handleInputChange(e, rowIndex, "B")}
        onKeyDown={(e) => handleKeyDown(e, rowIndex, "B")}
        onBlur={() => handleBlur(rowIndex, "B")}
      />
    </td>
    {/* C열 */}
    <td>
      <input
        type="number"
        value={
          editingValue[`${rowIndex}-C`] !== undefined
            ? editingValue[`${rowIndex}-C`]
            : row.C ?? ""
        }
        onChange={(e) => handleInputChange(e, rowIndex, "C")}
        onKeyDown={(e) => handleKeyDown(e, rowIndex, "C")}
        onBlur={() => handleBlur(rowIndex, "C")}
      />
    </td>
  </tr>
));

const App = () => {
  // Redux에서 필요한 상태 가져오기
  const data = useSelector((state) => state.table.data); // 모든 테이블 데이터
  const visibleRows = useSelector((state) => state.table.visibleRows); // 현재 렌더링된 행의 범위
  const a_value = useSelector((state) => state.table.a_value); // A열 1행의 값
  const dispatch = useDispatch();
  const [editingValue, setEditingValue] = useState({}); // 사용자 입력 상태를 저장하는 로컬 상태

  // 초기 렌더링 시 초기 visibleRows와 A열 첫 행 값을 설정
  useEffect(() => {
    dispatch(setVisibleRows({ start: 0, end: ROW_INCREMENT }));
    dispatch(setAValue(data[0]?.A || 0)); // A열 첫 행 값 저장
    // eslint-disable-next-line
  }, [dispatch]);

  // 입력값이 변경될 때 로컬 상태 업데이트
  const handleInputChange = (e, rowIndex, field) => {
    setEditingValue({
      ...editingValue,
      [`${rowIndex}-${field}`]: e.target.value,
    });
  };

  // 사용자가 엔터 키를 눌렀을 때 상태 업데이트 로직
  const handleKeyDown = (e, rowIndex, field) => {
    if (e.key === "Enter") {
      const value = parseInt(editingValue[`${rowIndex}-${field}`], 10) || 0;
      if (field === "A") {
        // A열 첫 행 업데이트 시 a_value도 갱신
        if (rowIndex === 0) {
          dispatch(setAValue(value));
        }
        dispatch(
          updateA({
            rowIndex,
            start: visibleRows.start,
            end: visibleRows.end,
            a_value: value,
          })
        );
      } else if (field === "B") {
        dispatch(
          updateB({
            rowIndex,
            value,
            end: visibleRows.end,
          })
        );
      } else if (field === "C") {
        dispatch(updateC({ rowIndex, value }));
      }

      // 입력값 초기화
      const updatedEditingValue = { ...editingValue };
      delete updatedEditingValue[`${rowIndex}-${field}`];
      setEditingValue(updatedEditingValue);
    }
  };

  // 입력 필드 포커스를 잃을 때 상태 업데이트
  const handleBlur = (rowIndex, field) => {
    if (editingValue[`${rowIndex}-${field}`] !== undefined) {
      const value = parseInt(editingValue[`${rowIndex}-${field}`], 10) || 0;
      if (field === "A") {
        if (rowIndex === 0) {
          dispatch(setAValue(value));
        }
        dispatch(updateA({ rowIndex, start: visibleRows.start, end: visibleRows.end, a_value: value }));
      } else if (field === "B") {
        dispatch(updateB({ rowIndex, value, end: visibleRows.end }));
      } else if (field === "C") {
        dispatch(updateC({ rowIndex, value }));
      }
      setEditingValue({ ...editingValue, [`${rowIndex}-${field}`]: undefined });
    }
  };

  // 스크롤 시 새로운 행을 렌더링
  const handleScroll = (e) => {
    const scrollTop = e.target.scrollTop;
    const scrollHeight = e.target.scrollHeight;
    const clientHeight = e.target.clientHeight;

    if (scrollTop + clientHeight >= scrollHeight - 10) {
      const newEnd = Math.min(visibleRows.end + ROW_INCREMENT, ROWS);
      dispatch(setVisibleRows({ start: visibleRows.start, end: newEnd }));
      // 스크롤에 따라 추가된 데이터에 A열 첫 행 값 반영
      dispatch(updateA({ rowIndex: 0, start: visibleRows.start, end: newEnd, a_value }));
    }
  };

  // 현재 렌더링 범위의 데이터를 필터링
  const renderedRows = Object.values(data).slice(visibleRows.start, visibleRows.end);

  return (
    <div className="table-container" onScroll={handleScroll}>
      <table>
        <thead>
          <tr>
            <th>ROW</th>
            <th>A</th>
            <th>B</th>
            <th>C</th>
          </tr>
        </thead>
        <tbody>
          {renderedRows.map((row, rowIndex) => (
            <TableRow
              key={row.ROW}
              row={row}
              rowIndex={rowIndex}
              handleInputChange={handleInputChange}
              handleKeyDown={handleKeyDown}
              handleBlur={handleBlur}
              editingValue={editingValue}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default App;