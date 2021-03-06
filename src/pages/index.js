import { connect } from 'dva';
import React from 'react';
import ReactDOM from 'react-dom';
import { Button, Row, Col, LocaleProvider, message, Alert, Input } from 'antd';
// 由于 antd 组件的默认文案是英文，所以需要修改为中文
import zhCN from 'antd/lib/locale-provider/zh_CN';
import moment from 'moment';
import 'moment/locale/zh-cn';
import "antd/dist/antd.css";
import "./index.css";
import G6 from '@antv/g6'
import Hierarchy from '@antv/hierarchy';


moment.locale('zh-cn');
const { TextArea } = Input;

class App extends React.Component {
  state = {
    conData: null,
  };

  submit = (conData) => {
      // message.info(`提交: ${this.state.conData}`);

      // const ctx = document.getElementById('id-of-canvas-element').getContext('2d');

      const contentData = this.state.conData;

      const PEM = 10;
      

      const graph = new G6.TreeGraph({
        container: 'mountNode',
        width: 1400,
        height: 500,
        defaultNode: {
          shape: 'rect',
          size: [250, 80],
          labelCfg: {
            style: {
              x: -100, 
              textAlign: 'left',
              fill: '#ffffff'
            }
          }
        },
        nodeStyle: {
          // 节点在默认状态下的样式
          default: {
            fill: '#FFC107',
            radius: 10
          },
        },
        pixelRatio: 2,
        modes: {
          default: [{
            type: 'collapse-expand',
            onChange(item, collapsed) {
              const data = item.get('model').data;
              data.collapsed = collapsed;
              return true;
            }
          }, 'drag-canvas', 'zoom-canvas']
        },
        layout: (data) => {
          const result = Hierarchy.compactBox(data, {
            direction: 'TB', // H / V / LR / RL / TB / BT
            getWidth(d) {
              return 250 + PEM * 1.6;
            },
            getHGap(d) {
              return PEM;
            },
            getVGap(d) {
              return PEM * 4;
            },
      
          });
          return result;
        },
        edgeStyle: {
          default: {
            stroke: '#A3B1BF'
          }
        },
        defaultEdge: {
          shape: 'cubic-horizontal'
        },
      });

      const data = this.state.topo;

      console.log(data);
      console.log(conData);

      graph.data(data);
      graph.render();

      const taskToColor = {
        OptimizeGroup: "#F44336",
        OptimizeExpression: "#9C27B0",
        ExploreGroup: "#2196F3",
        ExploreExpression: "#00BCD4",
        ApplyRule: "#8BC34A"
      }              
      
      for(var k in contentData)  {
        graph.updateItem(k, { 
          style: {
            fill: taskToColor[contentData[k].split('\n', 2)[1].split('::', 1)]
          }, 
          label: contentData[k]});
        console.log(taskToColor[contentData[k].split('::', 1)]);
      }

      graph.refresh();
  }

  onChange = (evt) => {
    this.setState({conData: evt.target.value})
  }
  onChangeTopo = (evt) => {
    this.setState({topo: evt.target.value})
  }

  onChangeTopo2 = (evt) => {
    const data =  evt.target.value;
    const lines = data.split('\n');
    const new_lines = []
    for (const index in lines) {
      const splited = lines[index].split(' - ');
      if (splited.length > 1) {
        const s = splited[1];
        if (!s.startsWith("Reordered")) {
          new_lines.push(splited[1]);
        }
      } else {
        new_lines.push(lines[index]);
      }
    }

    // new_lines.forEach( line => console.log(line));
    var tmp = [];
    const items = []

    var count = 0;

    new_lines.forEach(l => {
      if (l.startsWith('id:')) {
        if (tmp.length > 0) {
          const ll = [];
          ll.push(tmp[0]);
          ll.push(count + ":\n" + tmp.slice(1, tmp.length).join('\n'));
          count ++;
          items.push(ll); 
          tmp = [];
        }

        if (l.trim().length > 0) {
          tmp.push(l);
        }
      } else if (l) {
        if (l.trim().length > 0) {
          tmp.push(l);
        }
      }
    })

    if (tmp.length > 0) {
      const l = [];
      l.push(tmp[0]);
      l.push(tmp.slice(1, tmp.length).join('\n'));

      items.push(l); 
      tmp = [];
    }

    const d = {}
    const id2c = {}
    items.forEach(item => {
      const Id = item[0].split(" ")[1]
      const from_id = item[0].split(" ")[3]
      if (! (Id in d)) {
          d[Id] = {'id': Id, 'c': []}
      }

      if (!(from_id in d)) {
          d[from_id] = {'id': from_id, 'c': []}
      }

      d[from_id]['c'].push(Id)
      id2c[Id] = item[1].trim()
    });

    const t = this.dfs(d, '-1');
    t['isRoot'] = true;
    this.setState({topo: t});
    this.setState({conData: id2c});

  }
  
  dfs(d, task_id) {
    const r = {'id': task_id, 'children': []}
      d[task_id]['c'].forEach( c => {
        r['children'].push(this.dfs(d, c))
      }
    );
    return r
  }

  render() {
    return (
      <LocaleProvider locale={zhCN}>
        <div style={{ margin: '50px auto' }}>
          <Row type="flex" justify="center" align="top" >
            {/* < Col span = {10} >
              <TextArea rows={4} onChange={this.onChange} />
            </Col>
            <Col span = {1} ></Col> */}
            < Col span = {10} >
              <TextArea rows={4} onChange={this.onChangeTopo2} />
            </Col>
          </Row>
          <Row type='flex' justify="center" style={{margin: '20px'}}>
            <Button type="primary" onClick={this.submit} >Submit</Button>
          </Row>
          <div id="mountNode"></div>
        </div>
      </LocaleProvider>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));

export default connect(App());

// export default function() {
//   return (
//     <div>
//       <h1>Page index</h1>
//     </div>
//   );
// }
