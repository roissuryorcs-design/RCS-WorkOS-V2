import StatusCell from "./StatusCell";
import PersonCell from "./PersonCell";
import DateCell from "./DateCell";
import PriorityCell from "./PriorityCell";

export default function Row({ item }) {
  return (
    <tr>
      <td>{item.item}</td>

      <td>{item.document}</td>

      <td>
        <StatusCell status={item.status} />
      </td>

      <td>
        <PersonCell person={item.pic} />
      </td>

      <td>
        <DateCell due={item.due} />
      </td>

      <td>
        <PriorityCell priority={item.priority} />
      </td>
    </tr>
  );
}