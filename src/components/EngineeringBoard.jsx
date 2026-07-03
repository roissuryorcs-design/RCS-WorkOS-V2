import "../css/board.css";

import Toolbar from "./Toolbar";
import Group from "./Group";
import Row from "./Row";

import engineeringData from "../data/engineeringData";

export default function EngineeringBoard(){

    const groups=[...new Set(engineeringData.map(x=>x.group))];

    return(

        <div className="board">

            <Toolbar/>

            {

                groups.map(group=>(

                    <Group
                        key={group}
                        title={group}
                    >

                        <table>

                            <thead>

                                <tr>

                                    <th>Item</th>

                                    <th>Document</th>

                                    <th>Status</th>

                                    <th>PIC</th>

                                    <th>Due Date</th>

                                    <th>Priority</th>

                                </tr>

                            </thead>

                            <tbody>

                            {

                                engineeringData

                                .filter(item=>item.group===group)

                                .map(item=>(

                                    <Row
                                        key={item.id}
                                        item={item}
                                    />

                                ))

                            }

                            </tbody>

                        </table>

                    </Group>

                ))

            }

        </div>

    )

}