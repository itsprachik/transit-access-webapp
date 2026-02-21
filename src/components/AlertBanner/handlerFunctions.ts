
// Alert Banner handlers 
export const handleAlertClose = (
  index: number,
  setOpenStates: React.Dispatch<React.SetStateAction<Record<number, boolean>>>,
) => {
  setOpenStates((prev) => ({ ...prev, [index]: false }));
};
