import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function SizeGuidePage() {
  useEffect(() => {
    document.title = 'Hướng dẫn size — NT shop';
  }, []);

  return (
    <section className="size-guide">
      <p className="kicker">Hỗ trợ</p>
      <h1>Hướng dẫn chọn size</h1>
      <p className="lead">Đo theo bảng dưới. Nếu nằm giữa hai size, chọn size lớn hơn để mặc thoải mái.</p>

      <h2>Áo · Váy · Áo khoác</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Size</th>
              <th>Ngực (cm)</th>
              <th>Eo (cm)</th>
              <th>Cân nặng gợi ý</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>S</td><td>84–88</td><td>66–70</td><td>45–52 kg</td></tr>
            <tr><td>M</td><td>88–92</td><td>70–74</td><td>52–60 kg</td></tr>
            <tr><td>L</td><td>92–98</td><td>74–80</td><td>60–70 kg</td></tr>
            <tr><td>XL</td><td>98–104</td><td>80–86</td><td>70–80 kg</td></tr>
          </tbody>
        </table>
      </div>

      <h2>Quần</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Size</th>
              <th>Vòng eo (cm)</th>
              <th>Dài quần (cm)</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>29</td><td>74</td><td>98</td></tr>
            <tr><td>30</td><td>76</td><td>99</td></tr>
            <tr><td>31</td><td>79</td><td>100</td></tr>
            <tr><td>32</td><td>81</td><td>101</td></tr>
            <tr><td>33</td><td>84</td><td>102</td></tr>
          </tbody>
        </table>
      </div>

      <h2>Giày · Dép</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Size</th>
              <th>Chiều dài bàn chân (cm)</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>37</td><td>23.5</td></tr>
            <tr><td>38</td><td>24.0</td></tr>
            <tr><td>39</td><td>24.5</td></tr>
            <tr><td>40</td><td>25.0</td></tr>
            <tr><td>41</td><td>25.5</td></tr>
            <tr><td>42</td><td>26.0</td></tr>
            <tr><td>43</td><td>26.5</td></tr>
          </tbody>
        </table>
      </div>

      <Link className="btn btn-primary" to="/">Về trang chủ</Link>
    </section>
  );
}
